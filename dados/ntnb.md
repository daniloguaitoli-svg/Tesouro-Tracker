# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-02T01:05:15.507Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.9% | 3865.21 | 2.701 a | 2.504 | -2.46% | 2.55% | 31/08/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8% | 4453.39 | 3.558 a | 3.295 | -3.22% | 3.37% | 31/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.96% | 4338.28 | 5.043 a | 4.672 | -4.53% | 4.81% | 31/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.97% | 3008.27 | 5.956 a | 5.516 | -5.34% | 5.69% | 31/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.82% | 4311.78 | 6.672 a | 6.188 | -5.93% | 6.44% | 31/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.8% | 2474.98 | 8.704 a | 8.074 | -7.71% | 8.44% | 31/08/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.65% | 4286.07 | 7.737 a | 7.187 | -6.84% | 7.54% | 31/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.53% | 4161.37 | 9.327 a | 8.674 | -8.15% | 9.2% | 31/08/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.42% | 1754.34 | 13.962 a | 12.997 | -12.09% | 13.9% | 31/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.43% | 4175.85 | 10.748 a | 10.005 | -9.26% | 10.75% | 31/08/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.28% | 1282.98 | 18.712 a | 17.443 | -15.84% | 19.05% | 31/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.4% | 4047.12 | 12.135 a | 11.299 | -10.3% | 12.3% | 31/08/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.25% | 895.06 | 23.967 a | 22.347 | -19.75% | 24.95% | 31/08/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.3% | 4120.83 | 12.719 a | 11.853 | -10.68% | 13.02% | 31/08/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.29% | 4021.9 | 13.493 a | 12.576 | -11.22% | 13.93% | 31/08/2026 |

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
