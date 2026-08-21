# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-21T22:04:30.420Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 8.05% | 3847.04 | 2.734 a | 2.531 | -2.49% | 2.57% | 20/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8.1% | 4434.39 | 3.59 a | 3.321 | -3.25% | 3.4% | 20/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) ⭐ | 8.08% | 4309.86 | 5.073 a | 4.694 | -4.55% | 4.84% | 20/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 8.09% | 2985.55 | 5.989 a | 5.541 | -5.36% | 5.72% | 20/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.93% | 2446.97 | 8.737 a | 8.095 | -7.73% | 8.46% | 20/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) ⭐ | 7.95% | 4273.35 | 6.695 a | 6.202 | -5.94% | 6.46% | 20/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.77% | 4245.62 | 7.755 a | 7.196 | -6.84% | 7.55% | 20/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.56% | 1721.43 | 13.995 a | 13.011 | -12.1% | 13.92% | 20/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.67% | 4107.83 | 9.329 a | 8.664 | -8.14% | 9.18% | 20/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.39% | 1257.73 | 18.745 a | 17.455 | -15.85% | 19.06% | 20/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.55% | 4122.82 | 10.73 a | 9.976 | -9.23% | 10.72% | 20/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.51% | 3994.06 | 12.096 a | 11.251 | -10.26% | 12.24% | 20/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.34% | 876.66 | 24 a | 22.359 | -19.76% | 24.96% | 20/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.42% | 4059.7 | 12.646 a | 11.772 | -10.61% | 12.93% | 20/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.41% | 3958.85 | 13.395 a | 12.471 | -11.13% | 13.81% | 20/08/2026 |

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
