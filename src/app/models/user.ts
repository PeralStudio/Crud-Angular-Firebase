export interface User {
    id: string;
    apellido: string;
    nombre: string;
    filename : string;
    image: string;
    access: 'yes' | 'no';
}