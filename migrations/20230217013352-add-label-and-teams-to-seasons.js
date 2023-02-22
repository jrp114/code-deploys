module.exports = {
  async up(db, client) {
    const findAll = async() => {
      return db.collection('teams').find().toArray();
    }
    db.collection('seasons').updateMany({}, { $set: { teams: [] } }, { multi: true });
    const teams = await findAll();
    for (const t of teams) {
      const { _id, season } = t;
      db.collection('seasons').updateOne({ _id: season }, {
        $addToSet: {
          teams: _id
        }
      });
    }
    db.collection('seasons').dropIndex('year_1_organization_1');
    db.collection('seasons').updateMany({}, { $rename: { year: 'label' } }, { multi: true });
  },

  async down(db, client) {
    db.collection('seasons').updateMany({}, { $unset: { teams: 1 } }, { multi: true });
    db.collection('seasons').updateMany({}, { $unset: { label: 1 } }, { multi: true });
    db.collection('seasons').updateMany({}, { $rename: { label: 'year' } }, { multi: true });
    db.collection('seasons').createIndex({ year: 1, organization: 1 }, { unique: true });
  }
};
