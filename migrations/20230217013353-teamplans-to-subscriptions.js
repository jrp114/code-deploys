module.exports = {
  async up(db, client) {
    const findAll = async () => {
      return db.collection('teams').find().toArray();
    };
    const teams = await findAll();
    for (const team of teams) {
      const { _id, season, teamplan, organization } = team;
      const userOrganization = await db.collection('userorganizations').findOne({ organization, role: 'AccountOwner' });
      if (_id && teamplan) {
        const tplan = await db.collection('teamplans').findOne({ _id: teamplan });
        const subscription = {
          userOrganization: userOrganization && userOrganization._id,
          team: _id,
          season,
          teamplan: tplan.name,
        };
        await db.collection('subscriptions').insertOne(subscription);
      }
    }
  },

  async down(db, client) {
    db.collection('subscriptions').drop();
  }
};
