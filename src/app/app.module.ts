import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { FormComponent } from './component/form/form.component';
import { ListComponent } from './component/list/list.component';
import { DbService } from './services/db.service';


@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    ListComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    ReactiveFormsModule,
    AngularFireStorageModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  providers: [DbService],
  bootstrap: [AppComponent]
})
export class AppModule { }
