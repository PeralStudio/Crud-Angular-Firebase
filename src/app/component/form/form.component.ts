import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { DbService } from 'src/app/services/db.service';
import { User } from 'src/app/models/user';
import { v4 as uuidv4 } from 'uuid';
import { ToastrModule, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, OnChanges {

  userForm: FormGroup;
  msg: string;
  url: string | ArrayBuffer;
  uploadPercent: number;
  mode: 'add' | 'edit' = 'add'
  antiguoFilename: string;
  userID: string;
  file: string;
  porcentaje: number;
  id: string;

  @Input() userToEdit: User
  @Output() onFinished = new EventEmitter()


  constructor(private fb: FormBuilder, private dbService: DbService, private toastrService: ToastrService) { }

  ngOnInit(): void {
    this.userForm = this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('cambios', this.userToEdit)
    if (this.userToEdit) {
      this.mode = 'edit'

      window.scrollTo({
        top: 80,
        left: 0,
        behavior: 'smooth'
      });
      this.toastrService.info(`${this.userToEdit.nombre}, ${this.userToEdit.apellido}`, "Editando Usuario:");
      console.log(this.userToEdit.nombre, this.userToEdit.apellido)
      console.log(this.userToEdit.image)
      this.userForm.patchValue({
        firstName: this.userToEdit.nombre,
        lastName: this.userToEdit.apellido,
        access: this.userToEdit.access,
      });
      this.url = this.userToEdit.image;
      this.antiguoFilename = this.userToEdit.filename;
      this.userID = this.userToEdit.id;

      this.userForm.get("imagePost").clearValidators();
      this.userForm.get("imagePost").updateValueAndValidity()
    }
    else {
      this.reset()
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', Validators.required],
      access: new FormControl('', Validators.required),
      imagePost: new FormControl('', Validators.required),
    });

  }

  addNewUser() {
    //coger la url de descarga y mandarlo a firestorage
    if (this.userForm.valid) {
      const auxUser = this.userForm.value as User;
      //obtengo dato del usuario
      //referencia del archivo
      const identificador = this.mode == 'add' ? this.id : this.antiguoFilename

      if (this.file) {
        let ref = this.dbService.cloudStorage(identificador)
        let task = this.dbService.sendCloudStorage(identificador, this.file, this.mode)
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

  selectFile(event) {
    if (!event.target.files[0] || event.target.files[0].length == 0) {
      console.log(event.target.files[0])

      this.toastrService.error('Debes seleccionar una imagen');
      this.url = "";
      return;
    }
    var mimeType = event.target.files[0].type;

    if (mimeType.match(/image\/*/) == null) {
      this.toastrService.error('Solo valido imágenes');

      return;
    }
    var reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);

    reader.onload = (_event) => {
      this.toastrService.success('Foto cargada correctamente');
      this.url = reader.result;
    }
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

  editData(auxUser: any, url: string, identificador: string) {
    const docID = this.mode == 'add' ? uuidv4() : this.userID;
    let param: any = {}
    console.log('URL', url)
    if (url) {
      param = {
        id: docID,
        createdAt: this.dbService.serverTimestamp(),
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
        updatedAt: this.dbService.serverTimestamp(),
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

    result = this.dbService.addUser(this.mode, param, docID)

    result.then(() => {
      this.reset()
      this.toastrService.success(`Usuario: ${param.nombre}, ${param.apellido}  ${this.mode == 'add' ? 'Guardado' : 'Actualizado'}`);

    })
      .catch()
  }

  reset() {
    this.uploadPercent = 0;
    this.userForm?.reset();
    this.url = "";
    this.userID = ""
    this.antiguoFilename = ""
    this.file = null;
    this.mode = 'add';
    this.onFinished.emit(true)

    this.userForm?.get("imagePost").setValidators([Validators.required]);
    this.userForm?.get("imagePost").updateValueAndValidity()
  }

}