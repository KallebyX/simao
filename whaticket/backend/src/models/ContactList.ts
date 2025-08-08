import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany
} from "sequelize-typescript";
import Company from "./Company";
import ContactListItem from "./ContactListItem";

@Table({ tableName: "ContactLists" })
class ContactList extends Model<ContactList> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  name: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => ContactListItem, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  contacts: ContactListItem[];
}

export default ContactList;
