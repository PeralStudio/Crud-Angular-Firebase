import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'
import 'sweetalert2/src/sweetalert2.scss'
import { AngularFireStorage } from '@angular/fire/storage';
import { User } from '../models/user';
import { firestore } from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(
    private db: AngularFirestore,
    private toastr: ToastrService,
    private storage: AngularFireStorage,
  ) { }

  getUsers() {
    return this.db.collection<User>('users', x => x.orderBy('createdAt', 'desc')).valueChanges()
  }

  addUser(mode: 'add' | 'edit', user: User, docID: string) {
    const docRef = this.db.doc('users/' + docID).ref
    return mode == 'add' ? docRef.set(user) : docRef.update(user)
  }

  deleteUser(user: User) {
    //delete document Database
    return this.db.doc(`/users/${user.id}`).delete().then(e => {
      Swal.fire(
          'Eliminado!',
          `Usuario Eliminado: ${user.nombre}, ${user.apellido}.`,
          'success')
      this.deleteFile(user.filename).subscribe(() => {
        console.log('archivo eliminado')
      })
    });

  }

  deleteFile(filename: string) {
    return this.storage.ref(filename).delete();
  }

  cloudStorage(nombreArchivo: string) {
    return this.storage.ref(nombreArchivo)
  }

  sendCloudStorage(nombreArchivo: string, image: any, mode: 'add' | 'edit') {

    if (mode == 'add') {
      return this.storage.upload(nombreArchivo, image)
    }
    else {
      return this.storage.ref(nombreArchivo).put(image)
    }
  }

  serverTimestamp() {
    return firestore.FieldValue.serverTimestamp()
  }

}
