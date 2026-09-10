# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-09-10T22:40:08.297Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 13.81% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 744.02 | 2.312 a | -2% | 09/09/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.07% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19780.32 | — | — | 09/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.77% | juros reais ao ano ACIMA do IPCA | 3044.4 | 5.934 a | -5.33% | 09/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.6% | juros reais ao ano ACIMA do IPCA | 2517.34 | 8.682 a | -7.71% | 09/09/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.44% | — | — | 01/07/2026 |
| Ibovespa | 188269 pts | 32.26% | 1.66% | 10/09/2026 |
| EUR/BRL | 5.9481 | -6.19% | 0.42% | 10/09/2026 |
| USD/BRL | 5.1149 | -5.49% | 0.37% | 10/09/2026 |
| CDI | 13.9% a.a. | — | — | 09/09/2026 |
| Selic (meta) | 14% a.a. | — | — | 10/09/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
