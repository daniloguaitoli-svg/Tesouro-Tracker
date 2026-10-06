# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-06T01:20:14.039Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.39% | 3952.28 | 2.608 a | 2.429 | -2.39% | 2.47% | 02/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4557.96 | 3.468 a | 3.224 | -3.15% | 3.29% | 02/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.58% | 4459.08 | 4.96 a | 4.611 | -4.47% | 4.75% | 02/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.6% | 3100.24 | 5.863 a | 5.449 | -5.28% | 5.62% | 02/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.54% | 4429.81 | 6.6 a | 6.137 | -5.88% | 6.39% | 02/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.55% | 2549.88 | 8.611 a | 8.006 | -7.65% | 8.36% | 02/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.52% | 4368.42 | 7.661 a | 7.125 | -6.78% | 7.47% | 02/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.31% | 4282.11 | 9.284 a | 8.651 | -8.13% | 9.17% | 02/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.22% | 1817.44 | 13.868 a | 12.935 | -12.04% | 13.83% | 02/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.18% | 4322.37 | 10.763 a | 10.042 | -9.29% | 10.79% | 02/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.03% | 1352.37 | 18.619 a | 17.396 | -15.8% | 18.99% | 02/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.18% | 4188.63 | 12.187 a | 11.371 | -10.36% | 12.38% | 02/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.06% | 942.41 | 23.874 a | 22.3 | -19.71% | 24.89% | 02/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.09% | 4264.96 | 12.812 a | 11.964 | -10.77% | 13.15% | 02/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.08% | 4169.1 | 13.631 a | 12.729 | -11.34% | 14.12% | 02/10/2026 |

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
