import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Donador } from "./donador.entity";


@Entity()
export class Donacion {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  type: string;

  @Column()
  monto: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Donador, donador => donador.donaciones)
  donador: Donador;

  @Column()
  paymentId: number;
}