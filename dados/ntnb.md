# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-07T17:51:22.305Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.91% | 4002.24 | 2.605 a | 2.437 | -2.4% | 2.48% | 06/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7% | 4649.72 | 3.47 a | 3.243 | -3.17% | 3.31% | 06/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.94% | 4597.01 | 4.974 a | 4.651 | -4.51% | 4.79% | 06/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.95% | 3214.87 | 5.86 a | 5.479 | -5.3% | 5.66% | 06/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.92% | 4606.22 | 6.645 a | 6.215 | -5.96% | 6.47% | 06/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.92% | 2683.91 | 8.608 a | 8.051 | -7.69% | 8.41% | 06/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.91% | 4567.35 | 7.735 a | 7.235 | -6.88% | 7.59% | 06/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.72% | 4511.85 | 9.414 a | 8.821 | -8.29% | 9.36% | 06/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.64% | 1960.44 | 13.866 a | 13.002 | -12.1% | 13.91% | 06/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.65% | 4565.1 | 10.989 a | 10.303 | -9.52% | 11.08% | 06/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.55% | 1471.02 | 18.616 a | 17.472 | -15.86% | 19.08% | 06/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.62% | 4472.3 | 12.557 a | 11.778 | -10.71% | 12.84% | 06/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.51% | 1065.86 | 23.871 a | 22.412 | -19.8% | 25.03% | 06/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.54% | 4565.01 | 13.308 a | 12.492 | -11.22% | 13.76% | 06/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.54% | 4476.84 | 14.239 a | 13.365 | -11.87% | 14.86% | 06/10/2026 |

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
