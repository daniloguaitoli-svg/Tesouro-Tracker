# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-02T21:21:37.922Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.43% | 3944.53 | 2.619 a | 2.438 | -2.4% | 2.48% | 01/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4553.37 | 3.479 a | 3.234 | -3.16% | 3.3% | 01/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.6% | 4450.51 | 4.97 a | 4.619 | -4.48% | 4.76% | 01/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.62% | 3093.76 | 5.874 a | 5.458 | -5.28% | 5.63% | 01/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.55% | 4422.66 | 6.61 a | 6.146 | -5.89% | 6.4% | 01/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.56% | 2545.29 | 8.622 a | 8.016 | -7.66% | 8.37% | 01/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.53% | 4360.94 | 7.67 a | 7.133 | -6.79% | 7.48% | 01/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.34% | 4266.82 | 9.288 a | 8.653 | -8.13% | 9.17% | 01/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.26% | 1806.32 | 13.879 a | 12.94 | -12.04% | 13.84% | 01/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.2% | 4309.46 | 10.765 a | 10.042 | -9.29% | 10.79% | 01/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.05% | 1346.37 | 18.63 a | 17.403 | -15.81% | 19% | 01/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.19% | 4179.74 | 12.191 a | 11.374 | -10.37% | 12.38% | 01/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.06% | 941.48 | 23.885 a | 22.31 | -19.72% | 24.9% | 01/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.11% | 4250.6 | 12.805 a | 11.955 | -10.77% | 13.14% | 01/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.1% | 4154.42 | 13.619 a | 12.717 | -11.33% | 14.1% | 01/10/2026 |

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
