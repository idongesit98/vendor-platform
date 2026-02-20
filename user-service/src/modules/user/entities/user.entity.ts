import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lastName: string;

  @Column()
  firstName: string;

  @Column()
  email: string;
}
