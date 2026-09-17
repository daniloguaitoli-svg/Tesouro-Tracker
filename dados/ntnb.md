# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-17T01:31:03.386Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.47% | 3912.04 | 2.66 a | 2.475 | -2.43% | 2.52% | 15/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.55% | 4525.84 | 3.521 a | 3.274 | -3.2% | 3.35% | 15/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.59% | 4419.89 | 5.012 a | 4.658 | -4.52% | 4.8% | 15/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.61% | 3072.7 | 5.915 a | 5.497 | -5.32% | 5.67% | 15/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.55% | 4390.3 | 6.651 a | 6.185 | -5.93% | 6.44% | 15/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.56% | 2526.66 | 8.663 a | 8.054 | -7.69% | 8.42% | 15/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.47% | 4347.63 | 7.719 a | 7.183 | -6.83% | 7.53% | 15/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.35% | 4232.32 | 9.327 a | 8.688 | -8.17% | 9.21% | 15/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.28% | 1788.72 | 13.921 a | 12.976 | -12.07% | 13.88% | 15/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.33% | 4223.33 | 10.75 a | 10.016 | -9.27% | 10.77% | 15/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.26% | 1289.11 | 18.671 a | 17.407 | -15.81% | 19% | 15/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.31% | 4093.82 | 12.153 a | 11.325 | -10.32% | 12.33% | 15/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.24% | 898.22 | 23.926 a | 22.311 | -19.72% | 24.9% | 15/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.22% | 4165.43 | 12.748 a | 11.89 | -10.71% | 13.07% | 15/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.21% | 4067.81 | 13.539 a | 12.629 | -11.26% | 14% | 15/09/2026 |

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
