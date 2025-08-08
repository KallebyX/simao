import {
    Table,
    Column,
    CreatedAt,
    UpdatedAt,
    Model,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    AllowNull,
    HasMany,
    Unique
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "Invoices" })
class Invoices extends Model<Invoices> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number;

    @ForeignKey(() => Company)
    @Column
    companyId: number;

    @Column
    dueDate: string;

    @Column
    detail: string;

    @Column
    status: string;

    @Column
    value: number;

    @Column
    users: number;
  
    @Column
    connections: number;
  
    @Column
    queues: number;
  
    @Column
    useWhatsapp: boolean;   
  
    @Column
    useFacebook: boolean;   
  
    @Column
    useInstagram: boolean;   
    
    @Column
    useCampaigns: boolean;   
  
    @Column
    useSchedules: boolean;   
  
    @Column
    useInternalChat: boolean;   
    
    @Column
    useExternalApi: boolean;   

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;

    @Column
    linkInvoice: string;

    // Campos adicionais não definidos no modelo original mas usados no código
    @Column
    stripe_id?: string;

    @Column
    txid?: string;
}

export default Invoices;
