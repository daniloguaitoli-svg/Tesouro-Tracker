# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-29T21:27:04.055Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.54% | 3927.89 | 2.627 a | 2.443 | -2.4% | 2.48% | 28/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.68% | 4533.04 | 3.487 a | 3.238 | -3.17% | 3.31% | 28/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.67% | 4429.18 | 4.977 a | 4.622 | -4.48% | 4.76% | 28/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.69% | 3077.13 | 5.882 a | 5.462 | -5.29% | 5.64% | 28/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.61% | 4399.52 | 6.614 a | 6.146 | -5.89% | 6.4% | 28/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.62% | 2529.16 | 8.63 a | 8.019 | -7.66% | 8.38% | 28/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.55% | 4347.88 | 7.676 a | 7.137 | -6.79% | 7.48% | 28/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.4% | 4238.23 | 9.283 a | 8.643 | -8.12% | 9.16% | 28/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.32% | 1789.66 | 13.888 a | 12.94 | -12.04% | 13.84% | 28/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.35% | 4239 | 10.709 a | 9.976 | -9.23% | 10.72% | 28/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.26% | 1296.43 | 18.638 a | 17.377 | -15.79% | 18.97% | 28/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.3% | 4121.78 | 12.127 a | 11.302 | -10.3% | 12.3% | 28/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.18% | 915.39 | 23.893 a | 22.293 | -19.7% | 24.88% | 28/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.23% | 4184.09 | 12.707 a | 11.85 | -10.68% | 13.02% | 28/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.22% | 4085.72 | 13.495 a | 12.587 | -11.22% | 13.95% | 28/09/2026 |

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
