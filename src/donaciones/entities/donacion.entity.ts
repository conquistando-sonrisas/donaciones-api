import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Donador } from "./donador.entity";


@Entity()
export class Donacion {

  @PrimaryColumn({
    type: 'uuid',
    default: () => 'gen_random_uuid()'
  })
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