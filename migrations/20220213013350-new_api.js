const _ = require('lodash');
var generator = require('generate-password');
const Role = require("../helpers/role");

const markVerson = 9999;

module.exports = {
  async up(db, client) {
    const removeAll = async (collectionName, condition) => {
      await db.collection(collectionName).deleteMany(condition);
    }

    const findAll = async(collectionName, condition = {}) => {
      return await db.collection(collectionName).find(condition).toArray();
    }

    const findOne = async(collectionName, condition = {}) => {
      return await db.collection(collectionName).findOne(condition);
    }

    const updateOne = async(collectionName, condition, updateData) => {
      return await db.collection(collectionName).updateOne(condition, { $set: updateData });
    }

    const createUserOrganization = (organization, user, role) => {
      return db.collection('userorganizations').insertOne({
        organization,
        user,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const createUser = ({firstName, lastName, email}) => {
      const password =  generator.generate({
        length: 10,
        numbers: true
      });

      return db.collection('users').insertOne({
        firstName,
        lastName,
        email,
        password,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        __v: markVerson,
      });
    }

    const createCoach = async (coach) => {
      let user = await findOne('users', { email: coach.email });
      let userId = user ? user._id : null;
      
      if (!user) {
        console.log(`Creating user with email: ${coach.email}`);
        const { insertedId } = await createUser(coach);
        userId = insertedId;
      }
      
      return await createUserOrganization(coach.organization, userId, Role.HeadCoach);
    }

    const createPlayer = async (player) => {
      const email = `squadprofile_${player._id}@gmail.com`;
      console.log(`Creating player with email: ${email}`);
      const { insertedId } = await createUser({...player, email });

      const team = await findOne('teams', {players: {$elemMatch: {$eq: player._id} }});

      if (team && team.organization) {
        return await createUserOrganization(team.organization, insertedId, Role.Player);
      } else {
        console.log('player', player);
      }

      return null;
    }

    const createStaff = async (userOrganization) => {
      return db.collection('staffs').insertOne({
        userOrganization,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const createAccountOwners= async (organizations) => {
      let promises = [];
      for (let organization of organizations) {
        if (organization.user) {
          promises = [
            ...promises,
            createUserOrganization(organization._id, organization.user, Role.AccountOwner)
          ];
        }
      }

      await Promise.all(promises);

    }

    const createHeadCoaches= async () => {
      const coaches = await findAll('coaches');
      let promises = [];

      for (let coach of coaches) {
        let createdCoach = await createCoach(coach);
        let createdStaff = await createStaff(createdCoach.insertedId);

        // update coaches in team
        promises = [
          ...promises, 
          updateOne(
            'teams',
            {
              coaches: [coach._id]
            },
            {
              staffs: [createdStaff.insertedId]
            }
          )
        ];
      }

      await Promise.all(promises);

    }

    const createPlayers = async () => {
      const players = await findAll('players');
      let promises = [];
      for (let player of players) {
        let createdPlayer = await createPlayer(player);

        if (createdPlayer) {
          promises = [
            ...promises,
            updateOne('players', {_id: player._id}, 
            {
              userOrganization: createdPlayer.insertedId,
              emptyEmail: true
            })
          ];
        }
      }

      await Promise.all(promises);
    }
    
    console.log('----- Start running -----');
    await removeAll('staffs');
    await removeAll('userorganizations');
    await removeAll('users', {__v: markVerson})
    
    // // --- start test
    // // Những coaches không có tài khoản => chỉ add vào ở màng hình coach, ko phải owner
    // const users = await findAll('users');
    // const userEmails = users.map(user => user.email);
    // let testData = await findAll('coaches', {email: {$nin: userEmails}})
    // console.log('testData: ', testData, ', length: ', testData.length);

    // // Những user chỉ là owner khởi tạo ban đầu, và không phải coach
    // const coaches = await findAll('coaches');
    // const coachEmails = coaches.map(coach => coach.email);
    // testData = await findAll('users', {email: {$nin: coachEmails}})
    // console.log('testData: ', testData, ', length: ', testData.length);
    // // --- end test

    const organizations = await findAll('organizations');
    await createAccountOwners(organizations);
    await createHeadCoaches();
    await createPlayers();

    console.log('----- Complete -----');
    
  },

  async down(db, client) {
  }
};
