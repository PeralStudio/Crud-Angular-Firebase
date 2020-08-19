import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { User } from '../../models/user';
import { DbService } from 'src/app/services/db.service';

//Sweet alert / Toastr
import Swal from 'sweetalert2'
import 'sweetalert2/src/sweetalert2.scss'
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  userList: User[] = [];
  userToEdit: User //user a editar 
  loaded = false

  @Output() onEdit = new EventEmitter()

  constructor(
    private dbService: DbService, private toastrService: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loaded = true
    this.dbService.getUsers()
      .subscribe((result) => {
        this.userList = result;
        console.log(result)
      })
  }

  userListAccess(access: 'yes' | 'no'): User[] {
    return this.userList.filter(u => u.access === access);
  }

  edit(user: User) {

    this.onEdit.emit(user)
  }

  //FUNCION ELIMINAR (USUARIO Database, IMAGEN Storage)

  delete(users) {
    Swal.fire({
      title: '¿Estas seguro?',
      text: `Vas a borrar a ${users.nombre}, ${users.apellido}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: "Cancelar",
      confirmButtonText: 'Si, Borrar!'
    }).then((result) => {
      if (result.value) {

        console.log('delete', users.filename)

        //delete document Database
        this.dbService.deleteUser(users).then(e => {
          console.log('ususario eliminado')
        });
      } else if (
        result.dismiss === Swal.DismissReason.cancel
      ) {
        this.toastrService.error(`${users.nombre}, ${users.apellido} `, "Eliminación Cancelada:")
      }
    })
  }

}
