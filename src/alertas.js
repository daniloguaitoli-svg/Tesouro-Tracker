// src/alertas.js — os alertas de taxa: onde ficam guardados e quando disparam.
//
// SAÍRAM DE DENTRO DA TELA de Alertas, onde eram lidos e escritos, por um
// motivo de uso: um alerta atingido só aparecia para quem abrisse aquela aba —
// e ela fica atrás do "Mais" no celular. Quem cria um alerta quer saber dele
// ao abrir o app, não ao lembrar de ir conferir. Com a regra aqui, o App
// calcula os atingidos uma vez e mostra no Painel e na navegação.
//
// Continuam SÓ NESTE APARELHO (localStorage), pelo mesmo motivo dos
// acompanhados: o repositório é público, e uma meta de taxa diz o que a pessoa
// pretende comprar. Nada disto sobe para o Git nem para servidor nenhum.
//
// Arquivo puro, sem importar nada — o verificar.mjs exercita a regra em node.

export const CHAVE = "tesouro-tracker-alertas";

export function carregarAlertas() {
  if (typeof window === "undefined") return [];
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(bruto) ? bruto : [];
  } catch {
    return []; // storage corrompido não pode derrubar o app
  }
}

export function salvarAlertas(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* modo privativo ou cota cheia — o app segue funcionando sem persistir */
  }
}

// A regra do disparo, num lugar só. "Acima de 7" inclui o 7: quem pôs o alvo
// em 7,00% quer ser avisado quando a taxa CHEGAR lá, não só quando passar.
// Sem taxa (título sem preço no arquivo) não há disparo — ausência de dado
// nunca conta como condição satisfeita.
export function alertaAtingido(alerta, taxaAtual) {
  if (taxaAtual == null || !Number.isFinite(taxaAtual) || !Number.isFinite(alerta?.alvo)) return false;
  return alerta.direcao === "acima" ? taxaAtual >= alerta.alvo : taxaAtual <= alerta.alvo;
}

// Os alertas atingidos, cada um com o título a que se refere. Um alerta de um
// título que saiu da lista (venceu) simplesmente não dispara.
export function alertasAtingidos(alertas, titulos) {
  const porSlug = new Map((titulos || []).map((t) => [t.slug, t]));
  return (alertas || [])
    .map((alerta) => ({ alerta, titulo: porSlug.get(alerta.slug) || null }))
    .filter(({ alerta, titulo }) => titulo && alertaAtingido(alerta, titulo.taxa));
}
