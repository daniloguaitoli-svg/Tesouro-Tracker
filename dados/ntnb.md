# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-13T01:07:24.886Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.7% | 3888.9 | 2.671 a | 2.48 | -2.44% | 2.52% | 10/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.8% | 4487.9 | 3.53 a | 3.274 | -3.2% | 3.35% | 10/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.78% | 4379.86 | 5.018 a | 4.656 | -4.51% | 4.8% | 10/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.79% | 3041.71 | 5.926 a | 5.498 | -5.32% | 5.67% | 10/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.66% | 4359.45 | 6.654 a | 6.181 | -5.92% | 6.44% | 10/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.64% | 2509.8 | 8.674 a | 8.058 | -7.7% | 8.42% | 10/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.55% | 4321.65 | 7.72 a | 7.178 | -6.83% | 7.53% | 10/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.45% | 4194.8 | 9.315 a | 8.669 | -8.15% | 9.19% | 10/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.37% | 1767.6 | 13.932 a | 12.975 | -12.07% | 13.88% | 10/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.44% | 4176.25 | 10.714 a | 9.972 | -9.23% | 10.72% | 10/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.37% | 1264.49 | 18.682 a | 17.4 | -15.81% | 18.99% | 10/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.43% | 4037.87 | 12.085 a | 11.249 | -10.26% | 12.24% | 10/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.36% | 874.43 | 23.937 a | 22.296 | -19.71% | 24.89% | 10/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.36% | 4096.17 | 12.635 a | 11.769 | -10.61% | 12.93% | 10/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.36% | 3991.13 | 13.386 a | 12.469 | -11.13% | 13.81% | 10/09/2026 |

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
