# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-07T00:09:27.882Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.76% | 3962.27 | 2.492 a | 2.313 | -2.28% | 2.35% | 05/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.84% | 4573.88 | 3.348 a | 3.105 | -3.04% | 3.17% | 05/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.89% | 4447.21 | 4.83 a | 4.476 | -4.34% | 4.61% | 05/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.92% | 3082.39 | 5.734 a | 5.313 | -5.15% | 5.48% | 05/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.91% | 4381.57 | 6.439 a | 5.967 | -5.73% | 6.21% | 05/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.94% | 2500.9 | 8.46 a | 7.838 | -7.49% | 8.18% | 05/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.81% | 4329.22 | 7.486 a | 6.944 | -6.61% | 7.28% | 05/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.68% | 4196.03 | 9.063 a | 8.416 | -7.92% | 8.91% | 05/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.62% | 1746.11 | 13.694 a | 12.725 | -11.86% | 13.59% | 05/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.59% | 4197.57 | 10.446 a | 9.709 | -8.99% | 10.42% | 05/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.48% | 1265.47 | 18.405 a | 17.124 | -15.58% | 18.67% | 05/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.58% | 4050.75 | 11.788 a | 10.957 | -10.01% | 11.91% | 05/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.48% | 868.51 | 23.623 a | 21.979 | -19.46% | 24.5% | 05/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.56% | 4082.29 | 12.267 a | 11.405 | -10.3% | 12.51% | 05/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.56% | 3972.14 | 12.986 a | 12.074 | -10.8% | 13.35% | 05/11/2026 |

## Como ler

- **Taxa real** — juros ao ano *acima* do IPCA. É a taxa de compra (recompra do
  Tesouro); títulos fora de oferta deixam de publicar a taxa de venda, mas seguem
  publicando esta.
- **PU** — preço unitário em reais, do mesmo lado da taxa.
- **Duration** — prazo médio ponderado dos fluxos, em anos (Macaulay). Para o
  Tesouro IPCA+ sem cupom, é igual ao prazo; com juros semestrais é bem menor,
  porque parte do dinheiro volta antes.
- **Dur. mod.** — duration modificada: a variação percentual aproximada do preço
  para cada 1 ponto percentual de variação da taxa.
- **+1 p.p. / −1 p.p.** — quanto o preço se move hoje se a taxa real subir ou cair
  1 ponto percentual, já com o termo de convexidade (por isso não são simétricos).
- ⭐ marca os vencimentos acompanhados de perto.
- Os números usam **ponto decimal** e as datas dos arquivos .json usam **ISO
  (aaaa-mm-dd)**. É um arquivo de intercâmbio: o ponto decimal evita a ambiguidade
  do formato brasileiro para quem lê por máquina. Na tabela acima as datas
  aparecem em dd/mm/aaaa por legibilidade.

## Ressalvas

- Os dados têm defasagem de pelo menos um dia útil: o arquivo do Tesouro é de
  fechamento e este retrato é gerado uma vez por dia.
- Prazo, duration e sensibilidade usam dias úteis/252, a convenção oficial do
  Tesouro e da ANBIMA. O calendário são os feriados nacionais.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
