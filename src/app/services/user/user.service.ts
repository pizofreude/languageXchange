import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, QuerySnapshot, Query, orderBy } from '@angular/fire/firestore';
import { getAge } from 'src/app/extras/utils';
import { ApiService } from '../api/api.service';
import { ChatService } from '../chat/chat.service';
@Injectable({
  providedIn: 'root'
})
export class UserService {

  NUMBER_OF_USERS_PER_PAGE = 4;

  users = [];
  lastVisible: any;

  constructor(
    private firestore: Firestore,
    private chatService: ChatService,
    private api: ApiService
  ) {}

  async getUsersWithFilters(gender: string, country: string, languages: string[], minAge: number, maxAge: number): Promise<any[]> {
    const usersCollectionRef = collection(this.firestore, 'users');

    let usersQuery: Query = query(usersCollectionRef);

    if (gender) {
      usersQuery = query(usersQuery, where('gender', '==', gender));
    }

    if (country) {
      usersQuery = query(usersQuery, where('country.code', '==', country));
    }

    if (languages.length > 0) {
      usersQuery = query(usersQuery, where('languagesArray', 'array-contains-any', languages));
    }

    usersQuery = query(usersQuery, orderBy('lastSeen', 'desc'));

    const querySnapshot: QuerySnapshot<any> = await getDocs(usersQuery);
    const users: any[] = [];

    querySnapshot.forEach(doc => {
        const age = getAge(doc.get("birthdate").toDate());
        console.log('minAge: ', minAge, 'age: ', age, 'maxAge: ', maxAge);
        if (age >= minAge && age <= maxAge) {
          users.push(doc.data());
        }
    });
    
    console.log('users: ', users);
    return users;
  }

  //
  // Get User Methods
  //

  async getUsers() {
    let usersQuery: Query = query(this.api.collectionRef('users'));

    usersQuery = query(usersQuery, this.api.orderByQuery('lastSeen', 'desc'));

    if (this.lastVisible) {
      usersQuery = query(usersQuery, this.api.startAfterQuery(this.lastVisible));
    }
    
    usersQuery = query(usersQuery, this.api.limitQuery(this.NUMBER_OF_USERS_PER_PAGE));
    const querySnapshot: QuerySnapshot<any> = await this.api.getDocs2(usersQuery);

    querySnapshot.docs.map(doc => doc.data()).filter(user => user.uid !== this.chatService.currentUserId)
      .map( user => { this.users.push(user); });

    // TODO: Its working infinitely but it has to be fixed
    // Sometimes it returns null and it breaks the one of loadMore() event
    // It also may stay in infinite loop if it returns null
    let last = querySnapshot.docs[querySnapshot.docs.length-1];
    this.lastVisible = last || null;

    console.log('lastVisible: ', this.lastVisible, 'users.length: ', this.users.length, 'users: ', this.users);
    return this.users;
  }

  refreshUsers() {
    this.users = [];
    this.lastVisible = null;
  }

  // async getUsersWithFilter(queryFn) {
  //   return await this.api.getDocs(
  //     "users",
  //     queryFn,
  //     this.api.orderByQuery("lastSeen", "desc"),
  //     this.api.limitQuery(3)
  //   )
  // }

  // async getMoreUsers(lastItem) {
  //   return await this.api.getDocs(
  //     "users",
  //     this.api.orderByQuery("lastSeen", "desc"),
  //     this.api.startAfterQuery(lastItem),
  //     this.api.limitQuery(5)
  //   )
  // }

  //
  // Get User With Filter Methods
  //

  // TODO: its still not used in community page
  // async getMoreUsersWithFilter(lastItem, queryFn) {
  //   return await this.api.getDocs(
  //     "users",
  //     queryFn,
  //     this.api.orderByQuery("lastSeen", "desc"),
  //     this.api.startAfterQuery(lastItem),
  //     this.api.limitQuery(10)
  //   )
  // }

  //
  // Chat Room Methods
  //

}
