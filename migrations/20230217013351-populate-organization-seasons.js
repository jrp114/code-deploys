const mongoose = require('mongoose');

module.exports = {
  async up(db, client) {
    const findAll = async() => {
      return db.collection('teams').find().toArray();
    }
    db.collection('organizations').updateMany({}, { $set: { seasons: [] } }, { multi: true });
    const teams = await findAll()
    for (const team of teams) {
      const { organization, season } = team;
      console.log('Organization ID: ', organization)
      console.log('Season ID: ', season)
      const organizationId = mongoose.Types.ObjectId(organization);
      const seasonId = mongoose.Types.ObjectId(season);
      db.collection('organizations').updateOne({ _id: organizationId }, { $addToSet: {
        seasons: seasonId
      }})
    }
  },

  async down(db, client) {
    db.collection('organizations').updateMany({}, { $unset: { seasons: 1 } }, { multi: true })
  }
};
