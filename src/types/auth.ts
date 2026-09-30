export interface TechnicianUser {
  id: string;
  name: string;
  email: string;
  role: string; // Ex: "Técnico de TI", "Suporte", "Almoxarife", "Administrador"
  store: string; // Ex: "LOJA ACARAÚ", "LOJA PRÉA", "TODAS"
  avatarUrl?: string;
  createdAt: string;
}
