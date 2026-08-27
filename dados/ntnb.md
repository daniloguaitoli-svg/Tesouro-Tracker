# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-27T22:41:43.372Z.
Fonte: Tesouro Nacional (Tesouro Transparente) + ANBIMA (mercado secundário).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 8% | 3855.07 | 2.718 a | 2.516 | -2.47% | 2.56% | 26/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8.03% | 4448.34 | 3.574 a | 3.309 | -3.24% | 3.38% | 26/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.95% | 4339.65 | 5.06 a | 4.687 | -4.54% | 4.83% | 26/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.95% | 3011.13 | 5.973 a | 5.533 | -5.35% | 5.71% | 26/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.79% | 4319.17 | 6.69 a | 6.207 | -5.95% | 6.46% | 26/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.76% | 2482.61 | 8.721 a | 8.093 | -7.73% | 8.46% | 26/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.63% | 4291.72 | 7.756 a | 7.206 | -6.85% | 7.56% | 26/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4157.35 | 9.342 a | 8.687 | -8.16% | 9.21% | 26/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.44% | 1749.66 | 13.978 a | 13.01 | -12.1% | 13.92% | 26/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.43% | 4175.48 | 10.765 a | 10.02 | -9.27% | 10.77% | 26/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.28% | 1282.89 | 18.729 a | 17.458 | -15.85% | 19.06% | 26/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.39% | 4051.33 | 12.158 a | 11.321 | -10.32% | 12.32% | 26/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.23% | 898.99 | 23.984 a | 22.366 | -19.76% | 24.97% | 26/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.29% | 4125.39 | 12.744 a | 11.878 | -10.7% | 13.05% | 26/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.29% | 4021.6 | 13.509 a | 12.591 | -11.23% | 13.95% | 26/08/2026 |

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
