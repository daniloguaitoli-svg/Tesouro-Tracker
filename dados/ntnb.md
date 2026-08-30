# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-30T22:49:49.900Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.95% | 3859.6 | 2.71 a | 2.51 | -2.47% | 2.55% | 28/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8% | 4452.44 | 3.566 a | 3.302 | -3.23% | 3.38% | 28/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.93% | 4343.4 | 5.052 a | 4.681 | -4.54% | 4.82% | 28/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.93% | 3014.24 | 5.964 a | 5.526 | -5.35% | 5.7% | 28/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.79% | 4318.84 | 6.682 a | 6.199 | -5.94% | 6.46% | 28/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.76% | 2482.41 | 8.712 a | 8.085 | -7.72% | 8.45% | 28/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.63% | 4291.33 | 7.748 a | 7.199 | -6.85% | 7.55% | 28/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.53% | 4160.55 | 9.336 a | 8.682 | -8.16% | 9.2% | 28/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.43% | 1751.74 | 13.97 a | 13.004 | -12.1% | 13.91% | 28/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.43% | 4175.04 | 10.757 a | 10.013 | -9.26% | 10.76% | 28/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.29% | 1280.52 | 18.721 a | 17.449 | -15.84% | 19.05% | 28/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.4% | 4046.34 | 12.143 a | 11.307 | -10.31% | 12.3% | 28/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.25% | 894.9 | 23.975 a | 22.355 | -19.75% | 24.96% | 28/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.31% | 4115.19 | 12.718 a | 11.852 | -10.68% | 13.02% | 28/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.3% | 4016.11 | 13.49 a | 12.572 | -11.22% | 13.93% | 28/08/2026 |

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
