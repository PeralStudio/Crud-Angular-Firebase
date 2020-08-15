import { Component } from '@angular/core';

// Models
import { User } from './models/user';



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    userToEdit: User
    constructor() {

    }

    onEdit(user: User) {
        console.log('se precioono el boton de editar', user)
        this.userToEdit = user;
    }

    finishedEditing() {
        this.userToEdit = undefined;
    }

}
