import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Fiscal } from "./fiscal.entity";
import { Donacion } from "./donacion.entity";


@Entity()
export class Donador {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: false })
  apellidoPaterno: string;

  @Column({ type: 'varchar', nullable: true })
  apellidoMaterno: string | null;

  @Column({ nullable: false })
  @Index()
  correo: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  telefono: string | null;

  @Column({ type: 'boolean', default: false })
  needsComprobante: boolean;

  @Column({ default: false })
  canContactMe: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Fiscal)
  @JoinColumn()
  fiscal: Fiscal;

  @OneToMany(() => Donacion, donacion => donacion.donador)
  donaciones: Donacion[]
}