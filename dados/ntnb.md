# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-05T19:06:26.351Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.8% | 3877.21 | 2.693 a | 2.498 | -2.46% | 2.54% | 03/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.94% | 4464.98 | 3.551 a | 3.289 | -3.22% | 3.36% | 03/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.93% | 4347.09 | 5.036 a | 4.666 | -4.52% | 4.81% | 03/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.95% | 3013.5 | 5.948 a | 5.51 | -5.33% | 5.69% | 03/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4338.38 | 6.67 a | 6.192 | -5.94% | 6.45% | 03/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.7% | 2496.42 | 8.696 a | 8.074 | -7.71% | 8.44% | 03/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.6% | 4304 | 7.735 a | 7.189 | -6.84% | 7.54% | 03/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.48% | 4181.83 | 9.33 a | 8.681 | -8.16% | 9.2% | 03/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.37% | 1766.73 | 13.953 a | 12.996 | -12.09% | 13.9% | 03/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.42% | 4182.44 | 10.744 a | 10.002 | -9.26% | 10.75% | 03/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.3% | 1279.27 | 18.704 a | 17.432 | -15.83% | 19.03% | 03/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.4% | 4049.46 | 12.127 a | 11.291 | -10.29% | 12.29% | 03/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.28% | 889.63 | 23.959 a | 22.333 | -19.74% | 24.93% | 03/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.33% | 4108.62 | 12.684 a | 11.818 | -10.65% | 12.98% | 03/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.32% | 4009.11 | 13.452 a | 12.534 | -11.18% | 13.89% | 03/09/2026 |

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
- Duration e sensibilidade usam dias corridos/365. A convenção oficial da ANBIMA
  para NTN-B é dias úteis/252 — a diferença é desprezível para duration, mas existe.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
