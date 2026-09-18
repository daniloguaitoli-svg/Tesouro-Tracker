# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-18T01:19:33.818Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.47% | 3913.88 | 2.658 a | 2.473 | -2.43% | 2.51% | 16/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.6% | 4520.66 | 3.518 a | 3.269 | -3.2% | 3.34% | 16/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.64% | 4411.78 | 5.008 a | 4.652 | -4.51% | 4.79% | 16/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.66% | 3065.79 | 5.912 a | 5.492 | -5.32% | 5.67% | 16/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.59% | 4381.61 | 6.646 a | 6.177 | -5.92% | 6.43% | 16/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.6% | 2519.79 | 8.66 a | 8.049 | -7.69% | 8.41% | 16/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.5% | 4340.39 | 7.712 a | 7.174 | -6.82% | 7.52% | 16/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.37% | 4227 | 9.32 a | 8.68 | -8.16% | 9.2% | 16/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.3% | 1784.94 | 13.918 a | 12.971 | -12.07% | 13.87% | 16/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.35% | 4216.9 | 10.739 a | 10.004 | -9.26% | 10.75% | 16/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.28% | 1285.25 | 18.668 a | 17.402 | -15.81% | 19% | 16/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.32% | 4091.12 | 12.144 a | 11.316 | -10.32% | 12.32% | 16/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.23% | 900.63 | 23.923 a | 22.31 | -19.72% | 24.9% | 16/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.23% | 4162.43 | 12.737 a | 11.878 | -10.7% | 13.05% | 16/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.21% | 4069.7 | 13.537 a | 12.626 | -11.26% | 13.99% | 16/09/2026 |

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
