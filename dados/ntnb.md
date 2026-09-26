# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-26T01:40:20.045Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.5% | 3923.59 | 2.636 a | 2.452 | -2.41% | 2.49% | 24/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.68% | 4523.65 | 3.495 a | 3.246 | -3.17% | 3.32% | 24/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.66% | 4422.04 | 4.985 a | 4.631 | -4.49% | 4.77% | 24/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.68% | 3072.42 | 5.89 a | 5.47 | -5.3% | 5.65% | 24/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.6% | 4393.11 | 6.623 a | 6.155 | -5.9% | 6.41% | 24/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.61% | 2525.94 | 8.638 a | 8.027 | -7.67% | 8.39% | 24/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.53% | 4345.08 | 7.687 a | 7.148 | -6.8% | 7.5% | 24/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.39% | 4233.18 | 9.293 a | 8.654 | -8.13% | 9.17% | 24/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.31% | 1788.3 | 13.896 a | 12.949 | -12.05% | 13.85% | 24/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.35% | 4230.32 | 10.717 a | 9.983 | -9.24% | 10.73% | 24/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.27% | 1291.55 | 18.647 a | 17.383 | -15.79% | 18.97% | 24/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.29% | 4117.99 | 12.142 a | 11.317 | -10.32% | 12.32% | 24/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.16% | 917.58 | 23.901 a | 22.304 | -19.71% | 24.9% | 24/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.23% | 4175.56 | 12.715 a | 11.858 | -10.68% | 13.03% | 24/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.22% | 4077.4 | 13.504 a | 12.594 | -11.23% | 13.96% | 24/09/2026 |

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
