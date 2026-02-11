# Oq o código faz:
# 1 Limpeza de textos (pré-processamento)
# 2 Transformação dos textos em vetores (TF-IDF)
# 3 Criação de vetores médios por categoria
# 4 Classificação de textos novos usando similaridade de cosseno
# 5 Avaliação de acurácia em três cenários

# Requisitos:
# pip install pandas numpy nltk scikit-learn openpyxl

# PARTE 1 - Importar bibliotecas

import pandas as pd
import numpy as np
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from numpy.linalg import norm

# PARTE 2 - Preparar NLTK para stopwords e stemmer

# Baixar stopwords portuguesas (uma vez)
nltk.download("stopwords")

# Lista de palavras irrelevantes para ignorar
stop_words = set(stopwords.words("portuguese"))

# Stemmer para reduzir palavras ao radical
stemmer = SnowballStemmer("portuguese")

# PARTE 3 -Função de pré-processamento

def preprocess(texto):
    """
    Limpa e padroniza o texto.
    Passos:
    - Remove números e pontuação
    - Converte tudo para minúsculas
    - Remove stopwords
    - Aplica stemmer
    """
    texto = str(texto)  # garante que seja string
    # remove tudo que não é letra
    texto = re.sub(r"[^a-zA-ZÀ-ÿ\s]", "", texto)
    texto = texto.lower()  # minúsculas
    palavras = texto.split()
    palavras_limpa = [stemmer.stem(p) for p in palavras if p not in stop_words]
    return " ".join(palavras_limpa)

# PARTE 4 - Ler o arquivo Excel e limpar os textos

df = pd.read_excel("De-Para Descrição Cirurgias 2026.xlsx")

# Cria uma nova coluna com os textos pré-processados
df["texto_limpo"] = df["texto a ser classificado"].apply(preprocess)

# PARTE 5 - Função para calcular similaridade de cosseno

def cosine_similarity(v1, v2):
    """
    Calcula similaridade de cosseno entre dois vetores
    valor entre 0 e 1: 1 = vetores iguais, 0 = completamente diferentes
    """
    # evita divisão por zero
    if norm(v1) == 0 or norm(v2) == 0:
        return 0
    return np.dot(v1, v2) / (norm(v1) * norm(v2))

# PARTE 6 - Criar vetores médios por categoria

def criar_vetores_medios(textos, categorias, vectorizer):
    """
    Recebe uma lista de textos e suas categorias
    Retorna:
    - vectorizer treinado
    - dicionário com vetor médio de cada categoria
    - lista de categorias
    """
    X = vectorizer.fit_transform(textos)
    X_array = X.toarray()
    categorias_unicas = categorias.unique()
    vetores_medios = {}

    for cat in categorias_unicas:
        # pega todos os vetores da categoria
        vetores_cat = X_array[categorias == cat]
        # calcula a média
        vetores_medios[cat] = np.mean(vetores_cat, axis=0)

    return vectorizer, vetores_medios, categorias_unicas

# PARTE 7 - Função para classificar um texto

def classify(texto, vectorizer, vetores_medios, categorias):
    """
    Recebe um texto, transforma em vetor e compara com cada vetor médio.
    Retorna a categoria com maior similaridade.
    """
    vetor_texto = vectorizer.transform([preprocess(texto)]).toarray()[0]
    similaridades = {cat: cosine_similarity(vetor_texto, vetores_medios[cat]) for cat in categorias}
    return max(similaridades, key=similaridades.get)

# PARTE 8 - Cenário A - Treinar e testar com todos os dados

vectorizer_a = TfidfVectorizer()
vectorizer_a, vetores_medios_a, categorias_a = criar_vetores_medios(df["texto_limpo"], df["classificação"], vectorizer_a)

# Classificar todos os textos usando os vetores médios
df["pred_a"] = df["texto a ser classificado"].apply(
    lambda x: classify(x, vectorizer_a, vetores_medios_a, categorias_a)
)

# Calcular acurácia
acuracia_a = (df["pred_a"] == df["classificação"]).mean()
print(f"Cenário A - Treinar e testar com todos os dados: {acuracia_a*100:.2f}%")

# PARTE 9 - Cenário B e C - Treino 70% / Teste 30%

X_train, X_test, y_train, y_test = train_test_split(
    df["texto a ser classificado"], df["classificação"], test_size=0.3, random_state=42
)

# Treinar vetores médios apenas no conjunto de treino
vectorizer_bc = TfidfVectorizer()
vectorizer_bc, vetores_medios_bc, categorias_bc = criar_vetores_medios(
    X_train.apply(preprocess), y_train, vectorizer_bc
)

# Cenário B: testar todos os dados (70% treino)
df["pred_b"] = df["texto a ser classificado"].apply(
    lambda x: classify(x, vectorizer_bc, vetores_medios_bc, categorias_bc)
)
acuracia_b = (df["pred_b"] == df["classificação"]).mean()
print(f"Cenário B - Treinar 70%, testar todos os dados: {acuracia_b*100:.2f}%")

# Cenário C: testar apenas os 30% restantes
y_test_pred = X_test.apply(
    lambda x: classify(x, vectorizer_bc, vetores_medios_bc, categorias_bc)
)
acuracia_c = (y_test_pred == y_test).mean()
print(f"Cenário C - Treinar 70%, testar 30% restantes: {acuracia_c*100:.2f}%")