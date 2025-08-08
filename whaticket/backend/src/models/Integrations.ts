import {
    Table,
    CreatedAt,
    UpdatedAt,
    Model,
    PrimaryKey,
    Default,
    DataType,
    HasMany,
    AutoIncrement,
    BelongsTo,
    ForeignKey,
    Column
} from "sequelize-typescript";
import Queue from "./Queue";
import Company from "./Company";

@Table
class Integrations extends Model<Integrations> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number;

    @ForeignKey(() => Company)
    @Column
    companyId: number;
    @Column(DataType.TEXT)
    type: string;

    @Column
    @Column(DataType.TEXT)
    name: string;
    
    @Column(DataType.TEXT)
    projectName: string;
    
    @Column(DataType.TEXT)
    jsonContent: string;

    @Default(false)
    @Column
    isActive: boolean;
    @Column(DataType.TEXT)
    urlN8N: string;

    @Column(DataType.TEXT)
    language: string;

    @CreatedAt
    @Column(DataType.DATE(6))
    declare createdAt: Date;

    @UpdatedAt
    @Column(DataType.DATE(6))
    declare updatedAt: Date;

    @Column(DataType.TEXT)
    token: string;

    @Column
    foneContact: string;

    @Column
    userLogin: string;

    @Column
    passLogin: string;

    @Column
    initialCurrentMonth: number;
    @HasMany(() => Queue)
    queues: Queue[];
  
    @BelongsTo(() => Company)
    company: Company;
  
}

export default Integrations;