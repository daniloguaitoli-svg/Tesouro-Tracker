# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-11T15:04:37.684Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.7% | 3888.9 | 2.677 a | 2.485 | -2.44% | 2.53% | 10/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.8% | 4487.9 | 3.535 a | 3.279 | -3.21% | 3.35% | 10/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.78% | 4379.86 | 5.023 a | 4.661 | -4.52% | 4.8% | 10/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.79% | 3041.71 | 5.932 a | 5.503 | -5.33% | 5.68% | 10/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.66% | 4359.45 | 6.659 a | 6.186 | -5.93% | 6.44% | 10/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.64% | 2509.8 | 8.679 a | 8.063 | -7.7% | 8.43% | 10/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.55% | 4321.65 | 7.725 a | 7.183 | -6.83% | 7.53% | 10/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.45% | 4194.8 | 9.321 a | 8.675 | -8.15% | 9.2% | 10/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.37% | 1767.6 | 13.937 a | 12.98 | -12.08% | 13.88% | 10/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.44% | 4176.25 | 10.719 a | 9.977 | -9.23% | 10.72% | 10/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.37% | 1264.49 | 18.688 a | 17.405 | -15.81% | 19% | 10/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4037.87 | 12.091 a | 11.254 | -10.26% | 12.25% | 10/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.36% | 874.43 | 23.942 a | 22.301 | -19.71% | 24.89% | 10/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.36% | 4096.17 | 12.641 a | 11.774 | -10.62% | 12.93% | 10/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.36% | 3991.13 | 13.392 a | 12.474 | -11.13% | 13.82% | 10/09/2026 |

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
