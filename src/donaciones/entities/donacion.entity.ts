import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
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


  @Column({ type: 'varchar', nullable: true })
  idDonador: string | null;

  @ManyToOne(() => Donador, donador => donador.donaciones)
  @JoinColumn({ name: 'idDonador' })
  donador: Donador;

  @Column()
  paymentId: number;

  @Column({ type: 'varchar', nullable: true })
  preapprovalId: string | null;
}