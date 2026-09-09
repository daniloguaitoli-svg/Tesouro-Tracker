# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-09-09T22:37:24.470Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 13.84% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 743.19 | 2.315 a | -2% | 08/09/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.07% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19769.97 | — | — | 08/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.8% | juros reais ao ano ACIMA do IPCA | 3038.78 | 5.937 a | -5.33% | 08/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.6% | juros reais ao ano ACIMA do IPCA | 2516.84 | 8.685 a | -7.71% | 08/09/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.44% | — | — | 01/07/2026 |
| Ibovespa | 185629 pts | 31.08% | 0.23% | 09/09/2026 |
| EUR/BRL | 5.9278 | -6.84% | -0.27% | 09/09/2026 |
| USD/BRL | 5.0979 | -6.08% | -0.57% | 09/09/2026 |
| CDI | 13.9% a.a. | — | — | 08/09/2026 |
| Selic (meta) | 14% a.a. | — | — | 09/09/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
