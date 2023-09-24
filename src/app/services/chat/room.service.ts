import { Injectable } from '@angular/core';
import { AppwriteService } from '../appwrite/appwrite.service';
import { environment } from 'src/environments/environment';
import { ID, Query } from 'appwrite';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  constructor(
    private appwrite: AppwriteService,
    private auth: AuthService,
    private api: ApiService
  ) {}

  async checkRoom(userId: string): Promise<any> {
    this.auth.getId();
    let cUserId = this.auth.currentUser.uid;

    const promise = this.appwrite.listDocuments(
      environment.appwrite.ROOM_COLLECTION,
      [Query.search('users', cUserId), Query.search('users', userId)]
    );

    return promise.then((values) => {
      console.log('result checkROOM: ', values);
      if (values.total > 0) {
        console.log('Room found: ', values);
        return values.documents[0];
      } else {
        console.log('No room find, creating new one');
        return this.createRoom({
          users: [cUserId, userId],
          typing: [false, false],
        });
      }
    });
  }

  async getRooms(currentUserId: string): Promise<any> {
    return this.appwrite
      .listDocuments(environment.appwrite.ROOM_COLLECTION, [
        // Query.search('members', currentUserId),
        Query.search('users', currentUserId),
      ])
      .then((values) => {
        values.documents.forEach((element) => {
          element.users.forEach((user) => {
            if (user != currentUserId) {
              element.user = user;
            }
          });
          // TODO: FIRESTORE USER
          element.userData = this.api.docDataQuery(
            `users/${element.user}`,
            true
          );
        });
        return values;
      });
  }

  getRoom(roomId: string): Promise<any> {
    return this.appwrite.getDocument(
      environment.appwrite.ROOM_COLLECTION,
      roomId
    );
  }

  createRoom(data: any): Promise<any> {
    return this.appwrite.createDocument(
      environment.appwrite.ROOM_COLLECTION,
      ID.unique(),
      data
    );
  }

  updateRoom(roomId: string, data: any): Promise<any> {
    return this.appwrite.updateDocument(
      environment.appwrite.ROOM_COLLECTION,
      roomId,
      data
    );
  }

  // TODO: listen to room changes for messages.page.ts.
  // IDEA: use items collection, it will be relational one to many attribute which is named with the room id array
  listenRooms() {
    const client = this.appwrite.client$();
    return client.subscribe('documents', (response) => {
      if (
        response.events.includes(
          'databases.*.collections.' +
            environment.appwrite.ROOM_COLLECTION +
            '.documents.*'
        )
      ) {
        console.log(response.payload);
      }
    });
  }
}
