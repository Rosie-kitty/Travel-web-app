import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity('sessions')
  export class Session {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    token: string; // либо refreshToken, либо JWT
  
    @Column({ default: true })
    isActive: boolean;
  
    @ManyToOne(() => User, (user) => user.sessions)
    user: User;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  