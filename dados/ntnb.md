# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-10T00:05:27.245Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.79% | 4017.83 | 2.597 a | 2.432 | -2.39% | 2.47% | 08/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.83% | 4679.87 | 3.463 a | 3.242 | -3.17% | 3.31% | 08/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.81% | 4629.33 | 4.969 a | 4.652 | -4.51% | 4.79% | 08/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.82% | 3240.94 | 5.852 a | 5.478 | -5.3% | 5.65% | 08/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.83% | 4636.53 | 6.644 a | 6.219 | -5.96% | 6.48% | 08/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.84% | 2703.83 | 8.6 a | 8.049 | -7.69% | 8.41% | 08/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.85% | 4591.7 | 7.735 a | 7.239 | -6.88% | 7.59% | 08/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.73% | 4512.39 | 9.403 a | 8.81 | -8.28% | 9.34% | 08/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.69% | 1949.76 | 13.858 a | 12.989 | -12.08% | 13.89% | 08/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.69% | 4550.96 | 10.963 a | 10.276 | -9.5% | 11.05% | 08/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.64% | 1449.68 | 18.608 a | 17.45 | -15.85% | 19.05% | 08/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.69% | 4440.24 | 12.502 a | 11.718 | -10.66% | 12.77% | 08/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.65% | 1034.21 | 23.863 a | 22.375 | -19.77% | 24.98% | 08/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.61% | 4530 | 13.236 a | 12.415 | -11.16% | 13.67% | 08/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.62% | 4433.94 | 14.139 a | 13.261 | -11.78% | 14.74% | 08/10/2026 |

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
