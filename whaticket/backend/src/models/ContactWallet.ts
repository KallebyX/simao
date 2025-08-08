import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Contact from "./Contact";
import Company from "./Company";
import User from "./User";

@Table
class ContactWallet extends Model<ContactWallet> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  walletId: number;

  @BelongsTo(() => User)
  wallet: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

export default ContactWallet;
