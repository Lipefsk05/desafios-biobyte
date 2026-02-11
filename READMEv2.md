# Projeto 1 - Usando Node – PDF de Indicadores

Servidor **Node.js (Express)** que serve uma página em `http://localhost:3000` com um botão **“Gerar relatório em R”**. Ao clicar, o backend lê `data/relatorio.json` e gera um **PDF** com a tabela de indicadores.

## Requisitos

* **Node.js** LTS
  Verifique: `node -v && npm -v`
  (Instalação: [https://nodejs.org](https://nodejs.org))

## Instalação

No diretório `/node`:

```bash
npm init -y              # se ainda não existir package.json
npm i express pdfkit     # dependências principais
# (se o projeto usar) npm i cors axios
```

## Como executar (considerando ambiente linux)

```bash
node index.js
```

Abra **[http://localhost:3000](http://localhost:3000)** e clique em **“Gerar relatório em R”**.
Uma nova aba abrirá com o **PDF**.

---

## O que o candidato deve fazer

1. **Consertar erros para o projeto rodar corretamente**
   erros foram inseridos propositalmente para serem debugados e resolvidos pelo candidato
2. **Melhorar o layout do PDF**
   qualquer melhoria considerada pelo candidato


# Projeto 2 — Classificador Inteligente de Procedimentos Cirúrgicos

**Objetivo:** interagir pelo terminal: o programa recebe uma descrição de um procedimento cirúrgico e categoriza esses textos em especialidades (ex: Cardiologia, Ortopedia, Gastroenterologia). O problema é que cada médico escreve de um jeito.

---

## Etapas do Desafio:
1. Limpeza de Dados (Pré-processamento): Você deve criar uma função que prepare o texto:
•	Remova pontuações e converta tudo para letras minúsculas.
•	Remova as Stopwords (palavras como "o", "de", "com"). 
•	Aplique o Stemming (reduzir a palavra ao radical) para que "cirurgia" e "cirúrgico" sejam lidos como a mesma base.
•	É permitido usar bibliotecas de PLN para o português.

2. Transformação em Números (TF-IDF): 
Os textos limpos devem ser convertidos em vetores numéricos.
•	Use o método TFIDF para calcular a frequência de cada palavra.
Importante: Separe os primeiros dados para treinar o classificador abaixo e os demais para testar. Na pasta tem um arquivo .xls com os dados a serem usados no treinamento e no teste.


3. Classificação por Similaridade de Cosseno:
Nesta etapa, você não usará um modelo de classificação pronto, e sim matemática vetorial:
•	Para cada categoria, calcule o "vetor médio" na sua base de treino.
•	Para cada texto novo (da base de teste), calcule o ângulo (similaridade de cosseno) entre ele e os vetores das categorias.
•	O texto pertencerá à categoria que tiver o valor mais próximo de 1.


## O que o candidato deve fazer

1. Entregar o código desenvolvido em Pynthon ou na linguagem escolhida

2. Um breve relatório mostrando a Acurácia, quantos por cento ele acertou na base de teste, considerando os seguintes cenários:
	Cenário A - Treinar o classificador com todos os dados e testar com os mesmos dados;
	Cenário B - Treinar o classificador com 70% dos dados e testar com todos os dados;
	Cenário C - Treinar o classificador com 70% dos dados e testar com os 30% restantes;



Boa sorte! 🚀