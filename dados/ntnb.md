# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-08-29T02:50:58.168Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 8.05% | 3849.92 | 2.712 a | 2.51 | -2.47% | 2.55% | 27/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8.07% | 4442.1 | 3.569 a | 3.302 | -3.23% | 3.38% | 27/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 8% | 4329.16 | 5.053 a | 4.679 | -4.54% | 4.82% | 27/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 8% | 3002.58 | 5.967 a | 5.525 | -5.35% | 5.7% | 27/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.84% | 4305.46 | 6.681 a | 6.195 | -5.94% | 6.45% | 27/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.81% | 2472.41 | 8.715 a | 8.084 | -7.72% | 8.45% | 27/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.69% | 4272.89 | 7.743 a | 7.19 | -6.84% | 7.54% | 27/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.57% | 4146.14 | 9.329 a | 8.673 | -8.15% | 9.19% | 27/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.46% | 1744.94 | 13.973 a | 13.003 | -12.1% | 13.91% | 27/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.47% | 4158.4 | 10.742 a | 9.995 | -9.25% | 10.74% | 27/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.32% | 1273.87 | 18.723 a | 17.446 | -15.84% | 19.05% | 27/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4032.65 | 12.126 a | 11.288 | -10.29% | 12.28% | 27/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.26% | 892.91 | 23.978 a | 22.355 | -19.75% | 24.96% | 27/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.34% | 4100.61 | 12.694 a | 11.826 | -10.66% | 12.99% | 27/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.33% | 4001.02 | 13.46 a | 12.541 | -11.19% | 13.89% | 27/08/2026 |

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
