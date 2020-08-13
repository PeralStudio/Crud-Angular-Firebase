import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
// Firebase
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs/internal/observable';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
// Models
import { User } from './models/user';
import { v4 as uuidv4 } from 'uuid';



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


    @ViewChild('imageUser') inputImageUser: ElementRef;

    uploadPercent: number;
    urlImage: Observable<string>;

    ngOnInit(): void {
        this.loadUsers();
    }

    delete(users) {
        //elimna archivo de firebase
        this.storage.ref(users.filename).delete();
        //delete document
        this.db.doc(`/users/${users.id}`).delete().then(e => {
            this.toastr.error('Usuario Eliminado');
            this.loadUsers();
        })

    }

    edit(users) {
        console.log(users.nombre)
        console.log(users.image)
        this.userForm.patchValue({
            firstName: users.nombre, 
            lastName: users.apellido,
            access: users.access,
            imagePre2: {
                src:users.image
                
                
            } //users.image
            
            /*
            this.form.patchValue({
                name: 'Todd Motto',
                event: {
                    title: 'AngularCamp 2016',
                    location: 'Barcelona, Spain'
                }
            });
            */


            // formControlName2: myValue2 (can be omitted)
          });
         // this.userForm.controls
          
    //this.userForm.get('firstname').setValue('users.nombre');
        

    }

    //CONSEGUIR EDITAR

    /* public editCat(documentId) {
        const editSubscribe = this.firestoreService.getCat(documentId).subscribe((cat) => {
          this.currentStatus = 2;
          this.documentId = documentId;
          this.newCatForm.setValue({
            id: documentId,
            nombre: cat.payload.data()['nombre'],
            url: cat.payload.data()['url']
          });
          editSubscribe.unsubscribe();
        });
      } */


    onUpload(e) {
        // const id = Math.random().toString(36).substring(2);
        const data = e.target.files[0];
        this.file = data
        console.log('aa',data.name)
        const extension = data.name.split('.')[1].toLowerCase()
        this.id = `uploads/${uuidv4()}.${extension}`
        console.log(this.id)
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
        this.db.collection<User>('users').get().subscribe((result) => {
            this.userList = result.docs.map(item => { return <User>({ id: item.id, ...item.data() }) });
        })

    }

    cloudStorage(nombreArchivo: string) {
        return this.storage.ref(nombreArchivo)
    }

    sendCloudStorage(nombreArchivo: string, datos: any) {
        return this.storage.upload(nombreArchivo, datos)
    }

    addNewUser() {
        //coger la url de descarga y mandarlo a firestorage
        if (this.userForm.valid) {
            const auxUser = this.userForm.value as User;
            //obtengo dato del usuario
            //referencia del archivo
            let ref = this.cloudStorage(this.id)
            let task = this.sendCloudStorage(this.id, this.file)
            task.percentageChanges().subscribe(porcentaje => {
                this.porcentaje = Math.round(porcentaje)
                this.uploadPercent = this.porcentaje
                if (this.porcentaje == 100) {
                    console.log("finalizado")
                    //esperar a que este finalizado para obtener el url
                    ref.getDownloadURL().subscribe(async (URL) => {

                        const param = {
                            nombre: auxUser.firstName,
                            apellido: auxUser.lastName,
                            image: URL,
                            access: auxUser.access,
                            filename: this.id
                        }
                        //envio el objeto a firebase
                        await this.db.collection('users').add(param).then(() => {
                            this.loadUsers();
                            this.uploadPercent = 0;
                            this.userForm.reset();
                            this.url = "";
                            this.toastr.success('Usuario Guardado');
                        })
                            .catch()
                    })
                }
            })

        }
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

}
