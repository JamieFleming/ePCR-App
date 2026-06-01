export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) => [
	...root.querySelectorAll(selector),
];

export const val = (id) => ($(`#${id}`)?.value || "").trim();

export const isChecked = (id) => Boolean($(`#${id}`)?.checked);
