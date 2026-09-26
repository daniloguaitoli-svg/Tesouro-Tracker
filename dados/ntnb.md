# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-26T19:56:01.608Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.52% | 3925.01 | 2.636 a | 2.451 | -2.41% | 2.49% | 25/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.65% | 4531.87 | 3.495 a | 3.247 | -3.18% | 3.32% | 25/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.63% | 4431.91 | 4.986 a | 4.633 | -4.49% | 4.77% | 25/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.65% | 3080.05 | 5.89 a | 5.472 | -5.3% | 5.65% | 25/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.56% | 4407.6 | 6.626 a | 6.16 | -5.91% | 6.41% | 25/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.56% | 2538.17 | 8.638 a | 8.031 | -7.67% | 8.39% | 25/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.5% | 4358.03 | 7.691 a | 7.154 | -6.81% | 7.5% | 25/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.35% | 4251.35 | 9.302 a | 8.665 | -8.14% | 9.19% | 25/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.27% | 1799.03 | 13.896 a | 12.954 | -12.05% | 13.85% | 25/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.31% | 4250.74 | 10.734 a | 10.003 | -9.26% | 10.75% | 25/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.22% | 1303.84 | 18.647 a | 17.391 | -15.8% | 18.98% | 25/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.26% | 4135.41 | 12.162 a | 11.338 | -10.33% | 12.34% | 25/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.14% | 922.42 | 23.901 a | 22.309 | -19.72% | 24.9% | 25/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.19% | 4198.88 | 12.751 a | 11.895 | -10.72% | 13.07% | 25/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.2% | 4091.07 | 13.526 a | 12.617 | -11.25% | 13.98% | 25/09/2026 |

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
