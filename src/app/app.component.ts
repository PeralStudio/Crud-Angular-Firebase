import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
// Firebase
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs/internal/observable';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { firestore } from "firebase/app";
// Models
import { User } from './models/user';
import { v4 as uuidv4 } from 'uuid';

//Sweet alert
import Swal from 'sweetalert2'
import 'sweetalert2/src/sweetalert2.scss'



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    //[x: string]: any;

    userForm: FormGroup;
    userList: User[] = [];
    msg: string;
    url: string | ArrayBuffer;
    myform: any;

    // variable para guardar la url vieja de la foto temporalmente
    antiguoFilename: string;
    userID: string;


    constructor(
        private toastr: ToastrService,
        private storage: AngularFireStorage,
        private db: AngularFirestore,
        private fb: FormBuilder
    ) {
        this.userForm = this.createForm();
    }
    //nuevas variables
    downloadUrl: string;

    porcentaje: number;
    filepath: string;
    file: string;
    id: string;
    //arreglos
    userList1: User[] = []
    useList2: User[] = []
    mode: 'add' | 'edit' = 'add'
    dd: any


    @ViewChild('imageUser') inputImageUser: ElementRef;

    uploadPercent: number;
    urlImage: Observable<string>;

    ngOnInit(): void {
        this.loadUsers();
    }

    //FUNCION ELIMINAR (USUARIO Database, IMAGEN Storage)

    delete(users) {
        Swal.fire({
            title: '¿Estas seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Borrar!'
        }).then((result) => {
            if (result.value) {

                console.log('delete', users.filename)
                this.storage.ref(users.filename).delete();
                //delete document Database
                this.db.doc(`/users/${users.id}`).delete().then(e => {
                    this.toastr.error(`${users.nombre}, ${users.apellido} `, "Usuario Eliminado:");
                });
            } else if (
                result.dismiss === Swal.DismissReason.cancel
            ) {
                this.toastr.error(`${users.nombre}, ${users.apellido} `, "Eliminación Cancelada:")
            }
        })
    }

    //FUNCION EDITAR

    edit(users) {
        this.mode = 'edit'

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        this.toastr.info(`${users.nombre}, ${users.apellido}`, "Editando Usuario:");
        console.log(users.nombre, users.apellido)
        console.log(users.image)
        this.userForm.patchValue({
            firstName: users.nombre,
            lastName: users.apellido,
            access: users.access,
        });
        this.url = users.image;
        this.antiguoFilename = users.filename;
        this.userID = users.id;

        // 
        this.userForm.get("imagePost").clearValidators();
        this.userForm.get("imagePost").updateValueAndValidity()
    }

    //CAPTURAR RUTA IMAGEN

    onUpload(e) {
        const data = e.target.files[0];
        this.file = data
        console.log(data.name)
        const extension = data.name.split('.')[1].toLowerCase()
        this.id = `uploads/${uuidv4()}.${extension}`
        console.log('RUTA IMAGEN', this.id)
    }

    private createForm(): FormGroup {
        return this.fb.group({
            lastName: ['', Validators.required],
            firstName: ['', Validators.required],
            access: new FormControl('', Validators.required),
            imagePost: new FormControl('', Validators.required),
        });
    }

    loadUsers() {
        this.db.collection<User>('users', x => x.orderBy('createdAt', 'desc')).valueChanges()
            .subscribe((result) => {
                this.userList = result;
                console.log(result)
            })

    }

    cloudStorage(nombreArchivo: string) {

        return this.storage.ref(nombreArchivo)
    }

    sendCloudStorage(nombreArchivo: string, image: any) {

        if (this.mode == 'add') {
            return this.storage.upload(nombreArchivo, image)
        }
        else {
            return this.storage.ref(nombreArchivo).put(image)
        }
    }

    addNewUser() {
        //coger la url de descarga y mandarlo a firestorage
        if (this.userForm.valid) {
            const auxUser = this.userForm.value as User;
            //obtengo dato del usuario
            //referencia del archivo
            const identificador = this.mode == 'add' ? this.id : this.antiguoFilename

            if (this.file) {
                let ref = this.cloudStorage(identificador)
                let task = this.sendCloudStorage(identificador, this.file)
                task.percentageChanges().subscribe(porcentaje => {
                    this.porcentaje = Math.round(porcentaje)
                    this.uploadPercent = this.porcentaje
                    if (this.porcentaje == 100) {
                        console.log("finalizado")
                        //esperar a que este finalizado para obtener el url
                        ref.getDownloadURL().subscribe(async (url) => {
                            this.editData(auxUser, url, identificador)
                        })
                    }
                })
            }
            else {
                this.editData(auxUser, null, identificador)
            }

        }
    }

    editData(auxUser: any, url: string, identificador: string) {
        const docID = this.mode == 'add' ? uuidv4() : this.userID;
        let param: any = {}
        console.log('URL', url)
        if (url) {
            param = {
                id: docID,
                createdAt: firestore.FieldValue.serverTimestamp(),
                nombre: auxUser.firstName,
                apellido: auxUser.lastName,
                image: url,
                filename: identificador,
                access: auxUser.access,
            }
        }
        else {
            param = {
                id: docID,
                nombre: auxUser.firstName,
                updatedAt: firestore.FieldValue.serverTimestamp(),
                apellido: auxUser.lastName,
                // image: url,
                // filename: identificador, 
                access: auxUser.access,
            }
        }
        // const param = {
        //     id : docID,
        //     nombre: auxUser.firstName,
        //     apellido: auxUser.lastName,
        //     ...( this.url ? {
        //         image: url,
        //         filename: identificador
        //     } : {}),
        //     access: auxUser.access,
        // }

        //envio el objeto a firebase
        let result: Promise<any>
        const docRef = this.db.doc('users/' + docID).ref

        result = this.mode == 'add' ? docRef.set(param) : docRef.update(param)

        result.then(() => {
            this.uploadPercent = 0;
            this.userForm.reset();
            this.url = "";
            this.userID = ""
            this.antiguoFilename = ""
            this.file = null;
            this.mode = 'add';

            this.toastr.success(`Usuario: ${param.nombre}, ${param.apellido}  ${this.mode == 'add' ? 'Guardado' : 'Actualizado'}`);
        })
            .catch()
    }

    userListAccess(access: 'yes' | 'no'): User[] {
        return this.userList.filter(u => u.access === access);
    }

    selectFile(event) {
        if (!event.target.files[0] || event.target.files[0].length == 0) {
            console.log(event.target.files[0])

            this.toastr.error('Debes seleccionar una imagen');
            this.url = "";
            return;
        }

        var mimeType = event.target.files[0].type;

        if (mimeType.match(/image\/*/) == null) {
            this.toastr.error('Solo valido imágenes');

            return;
        }

        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]);

        reader.onload = (_event) => {
            this.toastr.success('Foto cargada correctamente');
            this.url = reader.result;
        }
    }

    reset() {
        this.uploadPercent = 0;
        this.userForm.reset();
        this.url = "";
        this.userID = ""
        this.antiguoFilename = ""
        this.file = null;
        this.mode = 'add';
    }

}
