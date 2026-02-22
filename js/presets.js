window.LyricsApp = window.LyricsApp || {};

// 500 Outlaw Country Standards
LyricsApp.Presets = [
  // === Waylon Jennings ===
  { title: "Luckenbach, Texas", artist: "Waylon Jennings", bpm: 96, beatsPerLine: 8 },
  { title: "Good Hearted Woman", artist: "Waylon Jennings", bpm: 112, beatsPerLine: 8 },
  { title: "Are You Sure Hank Done It This Way", artist: "Waylon Jennings", bpm: 100, beatsPerLine: 8 },
  { title: "I Ain't Living Long Like This", artist: "Waylon Jennings", bpm: 138, beatsPerLine: 8 },
  { title: "Honky Tonk Heroes", artist: "Waylon Jennings", bpm: 120, beatsPerLine: 8 },
  { title: "Rainy Day Woman", artist: "Waylon Jennings", bpm: 84, beatsPerLine: 8 },
  { title: "Bob Wills Is Still the King", artist: "Waylon Jennings", bpm: 124, beatsPerLine: 8 },
  { title: "I've Always Been Crazy", artist: "Waylon Jennings", bpm: 132, beatsPerLine: 8 },
  { title: "Dreaming My Dreams with You", artist: "Waylon Jennings", bpm: 76, beatsPerLine: 8 },
  { title: "Amanda", artist: "Waylon Jennings", bpm: 80, beatsPerLine: 8 },
  { title: "Don't You Think This Outlaw Bit's Done Got Out of Hand", artist: "Waylon Jennings", bpm: 108, beatsPerLine: 8 },
  { title: "Wurlitzer Prize", artist: "Waylon Jennings", bpm: 96, beatsPerLine: 8 },
  { title: "Theme from The Dukes of Hazzard", artist: "Waylon Jennings", bpm: 140, beatsPerLine: 8 },
  { title: "Ladies Love Outlaws", artist: "Waylon Jennings", bpm: 116, beatsPerLine: 8 },
  { title: "Only Daddy That'll Walk the Line", artist: "Waylon Jennings", bpm: 128, beatsPerLine: 8 },
  { title: "Rose in Paradise", artist: "Waylon Jennings", bpm: 92, beatsPerLine: 8 },
  { title: "Clyde", artist: "Waylon Jennings", bpm: 104, beatsPerLine: 8 },
  { title: "Storms Never Last", artist: "Waylon Jennings & Jessi Colter", bpm: 88, beatsPerLine: 8 },

  // === Willie Nelson ===
  { title: "On the Road Again", artist: "Willie Nelson", bpm: 126, beatsPerLine: 8 },
  { title: "Blue Eyes Crying in the Rain", artist: "Willie Nelson", bpm: 72, beatsPerLine: 8 },
  { title: "Always on My Mind", artist: "Willie Nelson", bpm: 76, beatsPerLine: 8 },
  { title: "Whiskey River", artist: "Willie Nelson", bpm: 120, beatsPerLine: 8 },
  { title: "Georgia on My Mind", artist: "Willie Nelson", bpm: 68, beatsPerLine: 8 },
  { title: "Funny How Time Slips Away", artist: "Willie Nelson", bpm: 72, beatsPerLine: 8 },
  { title: "Night Life", artist: "Willie Nelson", bpm: 66, beatsPerLine: 8 },
  { title: "Crazy", artist: "Willie Nelson", bpm: 72, beatsPerLine: 8 },
  { title: "Angel Flying Too Close to the Ground", artist: "Willie Nelson", bpm: 76, beatsPerLine: 8 },
  { title: "Seven Spanish Angels", artist: "Willie Nelson & Ray Charles", bpm: 80, beatsPerLine: 8 },
  { title: "To All the Girls I've Loved Before", artist: "Willie Nelson & Julio Iglesias", bpm: 100, beatsPerLine: 8 },
  { title: "City of New Orleans", artist: "Willie Nelson", bpm: 108, beatsPerLine: 8 },
  { title: "My Heroes Have Always Been Cowboys", artist: "Willie Nelson", bpm: 92, beatsPerLine: 8 },
  { title: "Red Headed Stranger", artist: "Willie Nelson", bpm: 88, beatsPerLine: 8 },
  { title: "Blue Skies", artist: "Willie Nelson", bpm: 120, beatsPerLine: 8 },
  { title: "Mendocino County Line", artist: "Willie Nelson", bpm: 100, beatsPerLine: 8 },
  { title: "Nothing I Can Do About It Now", artist: "Willie Nelson", bpm: 96, beatsPerLine: 8 },
  { title: "Still Is Still Moving to Me", artist: "Willie Nelson", bpm: 104, beatsPerLine: 8 },
  { title: "Bloody Mary Morning", artist: "Willie Nelson", bpm: 80, beatsPerLine: 8 },
  { title: "Me and Bobby McGee", artist: "Willie Nelson", bpm: 116, beatsPerLine: 8 },

  // === Waylon & Willie ===
  { title: "Mammas Don't Let Your Babies Grow Up to Be Cowboys", artist: "Waylon & Willie", bpm: 100, beatsPerLine: 8 },
  { title: "Good Hearted Woman", artist: "Waylon & Willie", bpm: 112, beatsPerLine: 8 },
  { title: "Pancho and Lefty", artist: "Merle Haggard & Willie Nelson", bpm: 96, beatsPerLine: 8 },

  // === Merle Haggard ===
  { title: "Mama Tried", artist: "Merle Haggard", bpm: 132, beatsPerLine: 8 },
  { title: "Okie from Muskogee", artist: "Merle Haggard", bpm: 100, beatsPerLine: 8 },
  { title: "The Fightin' Side of Me", artist: "Merle Haggard", bpm: 120, beatsPerLine: 8 },
  { title: "Sing Me Back Home", artist: "Merle Haggard", bpm: 80, beatsPerLine: 8 },
  { title: "Working Man Blues", artist: "Merle Haggard", bpm: 112, beatsPerLine: 8 },
  { title: "Silver Wings", artist: "Merle Haggard", bpm: 76, beatsPerLine: 8 },
  { title: "Today I Started Loving You Again", artist: "Merle Haggard", bpm: 72, beatsPerLine: 8 },
  { title: "That's the Way Love Goes", artist: "Merle Haggard", bpm: 96, beatsPerLine: 8 },
  { title: "Branded Man", artist: "Merle Haggard", bpm: 104, beatsPerLine: 8 },
  { title: "Hungry Eyes", artist: "Merle Haggard", bpm: 100, beatsPerLine: 8 },
  { title: "I Think I'll Just Stay Here and Drink", artist: "Merle Haggard", bpm: 116, beatsPerLine: 8 },
  { title: "If We Make It Through December", artist: "Merle Haggard", bpm: 80, beatsPerLine: 8 },
  { title: "The Bottle Let Me Down", artist: "Merle Haggard", bpm: 108, beatsPerLine: 8 },
  { title: "Misery and Gin", artist: "Merle Haggard", bpm: 88, beatsPerLine: 8 },
  { title: "Twinkle, Twinkle Lucky Star", artist: "Merle Haggard", bpm: 92, beatsPerLine: 8 },
  { title: "Big City", artist: "Merle Haggard", bpm: 84, beatsPerLine: 8 },
  { title: "Ramblin' Fever", artist: "Merle Haggard", bpm: 120, beatsPerLine: 8 },
  { title: "Lonesome Fugitive", artist: "Merle Haggard", bpm: 108, beatsPerLine: 8 },
  { title: "Swinging Doors", artist: "Merle Haggard", bpm: 140, beatsPerLine: 8 },
  { title: "I'm a Lonesome Fugitive", artist: "Merle Haggard", bpm: 108, beatsPerLine: 8 },

  // === Johnny Cash ===
  { title: "Ring of Fire", artist: "Johnny Cash", bpm: 108, beatsPerLine: 8 },
  { title: "Folsom Prison Blues", artist: "Johnny Cash", bpm: 104, beatsPerLine: 8 },
  { title: "I Walk the Line", artist: "Johnny Cash", bpm: 104, beatsPerLine: 8 },
  { title: "Man in Black", artist: "Johnny Cash", bpm: 96, beatsPerLine: 8 },
  { title: "Sunday Mornin' Comin' Down", artist: "Johnny Cash", bpm: 80, beatsPerLine: 8 },
  { title: "Jackson", artist: "Johnny Cash & June Carter", bpm: 120, beatsPerLine: 8 },
  { title: "A Boy Named Sue", artist: "Johnny Cash", bpm: 132, beatsPerLine: 8 },
  { title: "Get Rhythm", artist: "Johnny Cash", bpm: 160, beatsPerLine: 8 },
  { title: "Big River", artist: "Johnny Cash", bpm: 112, beatsPerLine: 8 },
  { title: "Cocaine Blues", artist: "Johnny Cash", bpm: 168, beatsPerLine: 8 },
  { title: "Cry Cry Cry", artist: "Johnny Cash", bpm: 140, beatsPerLine: 8 },
  { title: "Hurt", artist: "Johnny Cash", bpm: 76, beatsPerLine: 8 },
  { title: "Ghost Riders in the Sky", artist: "Johnny Cash", bpm: 100, beatsPerLine: 8 },
  { title: "Tennessee Flat Top Box", artist: "Johnny Cash", bpm: 132, beatsPerLine: 8 },
  { title: "Don't Take Your Guns to Town", artist: "Johnny Cash", bpm: 96, beatsPerLine: 8 },
  { title: "Guess Things Happen That Way", artist: "Johnny Cash", bpm: 120, beatsPerLine: 8 },
  { title: "The Highwayman", artist: "The Highwaymen", bpm: 92, beatsPerLine: 8 },
  { title: "Desperados Waiting for a Train", artist: "The Highwaymen", bpm: 96, beatsPerLine: 8 },

  // === Kris Kristofferson ===
  { title: "Me and Bobby McGee", artist: "Kris Kristofferson", bpm: 116, beatsPerLine: 8 },
  { title: "Sunday Mornin' Comin' Down", artist: "Kris Kristofferson", bpm: 80, beatsPerLine: 8 },
  { title: "Help Me Make It Through the Night", artist: "Kris Kristofferson", bpm: 72, beatsPerLine: 8 },
  { title: "For the Good Times", artist: "Kris Kristofferson", bpm: 68, beatsPerLine: 8 },
  { title: "Why Me", artist: "Kris Kristofferson", bpm: 80, beatsPerLine: 8 },
  { title: "Loving Her Was Easier", artist: "Kris Kristofferson", bpm: 84, beatsPerLine: 8 },
  { title: "The Pilgrim, Chapter 33", artist: "Kris Kristofferson", bpm: 96, beatsPerLine: 8 },
  { title: "To Beat the Devil", artist: "Kris Kristofferson", bpm: 92, beatsPerLine: 8 },
  { title: "Casey's Last Ride", artist: "Kris Kristofferson", bpm: 76, beatsPerLine: 8 },
  { title: "Silver Tongued Devil and I", artist: "Kris Kristofferson", bpm: 120, beatsPerLine: 8 },

  // === David Allan Coe ===
  { title: "You Never Even Called Me by My Name", artist: "David Allan Coe", bpm: 108, beatsPerLine: 8 },
  { title: "The Ride", artist: "David Allan Coe", bpm: 96, beatsPerLine: 8 },
  { title: "Mona Lisa Lost Her Smile", artist: "David Allan Coe", bpm: 76, beatsPerLine: 8 },
  { title: "Longhaired Redneck", artist: "David Allan Coe", bpm: 116, beatsPerLine: 8 },
  { title: "Willie, Waylon and Me", artist: "David Allan Coe", bpm: 104, beatsPerLine: 8 },
  { title: "Jack Daniel's If You Please", artist: "David Allan Coe", bpm: 108, beatsPerLine: 8 },
  { title: "Take This Job and Shove It", artist: "David Allan Coe", bpm: 120, beatsPerLine: 8 },

  // === Hank Williams ===
  { title: "Jambalaya (On the Bayou)", artist: "Hank Williams", bpm: 116, beatsPerLine: 8 },
  { title: "Your Cheatin' Heart", artist: "Hank Williams", bpm: 100, beatsPerLine: 8 },
  { title: "Hey, Good Lookin'", artist: "Hank Williams", bpm: 132, beatsPerLine: 8 },
  { title: "I'm So Lonesome I Could Cry", artist: "Hank Williams", bpm: 72, beatsPerLine: 8 },
  { title: "Cold Cold Heart", artist: "Hank Williams", bpm: 92, beatsPerLine: 8 },
  { title: "Move It on Over", artist: "Hank Williams", bpm: 156, beatsPerLine: 8 },
  { title: "I Saw the Light", artist: "Hank Williams", bpm: 120, beatsPerLine: 8 },
  { title: "Honky Tonkin'", artist: "Hank Williams", bpm: 140, beatsPerLine: 8 },
  { title: "Long Gone Lonesome Blues", artist: "Hank Williams", bpm: 140, beatsPerLine: 8 },
  { title: "Lovesick Blues", artist: "Hank Williams", bpm: 150, beatsPerLine: 8 },
  { title: "Settin' the Woods on Fire", artist: "Hank Williams", bpm: 160, beatsPerLine: 8 },
  { title: "Mind Your Own Business", artist: "Hank Williams", bpm: 132, beatsPerLine: 8 },
  { title: "You Win Again", artist: "Hank Williams", bpm: 108, beatsPerLine: 8 },
  { title: "Ramblin' Man", artist: "Hank Williams", bpm: 120, beatsPerLine: 8 },
  { title: "Kaw-Liga", artist: "Hank Williams", bpm: 108, beatsPerLine: 8 },

  // === Hank Williams Jr. ===
  { title: "Family Tradition", artist: "Hank Williams Jr.", bpm: 120, beatsPerLine: 8 },
  { title: "A Country Boy Can Survive", artist: "Hank Williams Jr.", bpm: 100, beatsPerLine: 8 },
  { title: "Whiskey Bent and Hell Bound", artist: "Hank Williams Jr.", bpm: 116, beatsPerLine: 8 },
  { title: "All My Rowdy Friends (Have Settled Down)", artist: "Hank Williams Jr.", bpm: 120, beatsPerLine: 8 },
  { title: "Dixie on My Mind", artist: "Hank Williams Jr.", bpm: 92, beatsPerLine: 8 },
  { title: "Women I've Never Had", artist: "Hank Williams Jr.", bpm: 108, beatsPerLine: 8 },
  { title: "Texas Women", artist: "Hank Williams Jr.", bpm: 128, beatsPerLine: 8 },
  { title: "Attitude Adjustment", artist: "Hank Williams Jr.", bpm: 116, beatsPerLine: 8 },
  { title: "Born to Boogie", artist: "Hank Williams Jr.", bpm: 128, beatsPerLine: 8 },
  { title: "If Heaven Ain't a Lot Like Dixie", artist: "Hank Williams Jr.", bpm: 100, beatsPerLine: 8 },

  // === Hank Williams III ===
  { title: "Long Gone Daddy", artist: "Hank Williams III", bpm: 160, beatsPerLine: 8 },
  { title: "Straight to Hell", artist: "Hank Williams III", bpm: 140, beatsPerLine: 8 },
  { title: "Dick in Dixie", artist: "Hank Williams III", bpm: 152, beatsPerLine: 8 },
  { title: "Country Heroes", artist: "Hank Williams III", bpm: 120, beatsPerLine: 8 },

  // === Townes Van Zandt ===
  { title: "Pancho and Lefty", artist: "Townes Van Zandt", bpm: 96, beatsPerLine: 8 },
  { title: "If I Needed You", artist: "Townes Van Zandt", bpm: 80, beatsPerLine: 8 },
  { title: "To Live Is to Fly", artist: "Townes Van Zandt", bpm: 88, beatsPerLine: 8 },
  { title: "Waiting Around to Die", artist: "Townes Van Zandt", bpm: 76, beatsPerLine: 8 },
  { title: "Tecumseh Valley", artist: "Townes Van Zandt", bpm: 84, beatsPerLine: 8 },
  { title: "White Freightliner Blues", artist: "Townes Van Zandt", bpm: 152, beatsPerLine: 8 },
  { title: "Kathleen", artist: "Townes Van Zandt", bpm: 80, beatsPerLine: 8 },
  { title: "Lungs", artist: "Townes Van Zandt", bpm: 72, beatsPerLine: 8 },
  { title: "Dollar Bill Blues", artist: "Townes Van Zandt", bpm: 100, beatsPerLine: 8 },
  { title: "Rex's Blues", artist: "Townes Van Zandt", bpm: 80, beatsPerLine: 8 },

  // === Guy Clark ===
  { title: "L.A. Freeway", artist: "Guy Clark", bpm: 108, beatsPerLine: 8 },
  { title: "Desperados Waiting for a Train", artist: "Guy Clark", bpm: 96, beatsPerLine: 8 },
  { title: "That Old Time Feeling", artist: "Guy Clark", bpm: 80, beatsPerLine: 8 },
  { title: "Texas 1947", artist: "Guy Clark", bpm: 100, beatsPerLine: 8 },
  { title: "Homegrown Tomatoes", artist: "Guy Clark", bpm: 120, beatsPerLine: 8 },
  { title: "The Randall Knife", artist: "Guy Clark", bpm: 84, beatsPerLine: 8 },
  { title: "Dublin Blues", artist: "Guy Clark", bpm: 92, beatsPerLine: 8 },
  { title: "Stuff That Works", artist: "Guy Clark", bpm: 96, beatsPerLine: 8 },

  // === Billy Joe Shaver ===
  { title: "Georgia on a Fast Train", artist: "Billy Joe Shaver", bpm: 132, beatsPerLine: 8 },
  { title: "Old Five and Dimers Like Me", artist: "Billy Joe Shaver", bpm: 96, beatsPerLine: 8 },
  { title: "Honky Tonk Heroes", artist: "Billy Joe Shaver", bpm: 120, beatsPerLine: 8 },
  { title: "Live Forever", artist: "Billy Joe Shaver", bpm: 108, beatsPerLine: 8 },
  { title: "I Been to Georgia on a Fast Train", artist: "Billy Joe Shaver", bpm: 132, beatsPerLine: 8 },
  { title: "Ride Me Down Easy", artist: "Billy Joe Shaver", bpm: 80, beatsPerLine: 8 },

  // === Jerry Jeff Walker ===
  { title: "Mr. Bojangles", artist: "Jerry Jeff Walker", bpm: 84, beatsPerLine: 8 },
  { title: "Up Against the Wall Redneck Mother", artist: "Jerry Jeff Walker", bpm: 120, beatsPerLine: 8 },
  { title: "Sangria Wine", artist: "Jerry Jeff Walker", bpm: 108, beatsPerLine: 8 },
  { title: "London Homesick Blues", artist: "Jerry Jeff Walker", bpm: 116, beatsPerLine: 8 },
  { title: "Gettin' By", artist: "Jerry Jeff Walker", bpm: 96, beatsPerLine: 8 },
  { title: "Redneck Mother", artist: "Jerry Jeff Walker", bpm: 120, beatsPerLine: 8 },

  // === Johnny Paycheck ===
  { title: "Take This Job and Shove It", artist: "Johnny Paycheck", bpm: 120, beatsPerLine: 8 },
  { title: "Old Violin", artist: "Johnny Paycheck", bpm: 80, beatsPerLine: 8 },
  { title: "She's All I Got", artist: "Johnny Paycheck", bpm: 72, beatsPerLine: 8 },
  { title: "Slide Off of Your Satin Sheets", artist: "Johnny Paycheck", bpm: 96, beatsPerLine: 8 },
  { title: "Colorado Kool-Aid", artist: "Johnny Paycheck", bpm: 108, beatsPerLine: 8 },

  // === Jessi Colter ===
  { title: "I'm Not Lisa", artist: "Jessi Colter", bpm: 76, beatsPerLine: 8 },
  { title: "Storms Never Last", artist: "Jessi Colter", bpm: 88, beatsPerLine: 8 },
  { title: "What's Happened to Blue Eyes", artist: "Jessi Colter", bpm: 80, beatsPerLine: 8 },

  // === Tompall Glaser ===
  { title: "Put Another Log on the Fire", artist: "Tompall Glaser", bpm: 104, beatsPerLine: 8 },
  { title: "T for Texas", artist: "Tompall Glaser", bpm: 136, beatsPerLine: 8 },

  // === Charlie Daniels Band ===
  { title: "The Devil Went Down to Georgia", artist: "Charlie Daniels Band", bpm: 132, beatsPerLine: 8 },
  { title: "Long Haired Country Boy", artist: "Charlie Daniels Band", bpm: 96, beatsPerLine: 8 },
  { title: "The South's Gonna Do It Again", artist: "Charlie Daniels Band", bpm: 140, beatsPerLine: 8 },
  { title: "Uneasy Rider", artist: "Charlie Daniels Band", bpm: 120, beatsPerLine: 8 },
  { title: "Drinkin' My Baby Goodbye", artist: "Charlie Daniels Band", bpm: 112, beatsPerLine: 8 },
  { title: "Still in Saigon", artist: "Charlie Daniels Band", bpm: 108, beatsPerLine: 8 },

  // === Marshall Tucker Band ===
  { title: "Can't You See", artist: "Marshall Tucker Band", bpm: 92, beatsPerLine: 8 },
  { title: "Heard It in a Love Song", artist: "Marshall Tucker Band", bpm: 112, beatsPerLine: 8 },
  { title: "Fire on the Mountain", artist: "Marshall Tucker Band", bpm: 120, beatsPerLine: 8 },
  { title: "24 Hours at a Time", artist: "Marshall Tucker Band", bpm: 100, beatsPerLine: 8 },

  // === Lynyrd Skynyrd ===
  { title: "Sweet Home Alabama", artist: "Lynyrd Skynyrd", bpm: 100, beatsPerLine: 8 },
  { title: "Free Bird", artist: "Lynyrd Skynyrd", bpm: 60, beatsPerLine: 8 },
  { title: "Simple Man", artist: "Lynyrd Skynyrd", bpm: 60, beatsPerLine: 8 },
  { title: "Tuesday's Gone", artist: "Lynyrd Skynyrd", bpm: 72, beatsPerLine: 8 },
  { title: "Gimme Three Steps", artist: "Lynyrd Skynyrd", bpm: 132, beatsPerLine: 8 },
  { title: "Call Me the Breeze", artist: "Lynyrd Skynyrd", bpm: 128, beatsPerLine: 8 },

  // === Allman Brothers ===
  { title: "Ramblin' Man", artist: "Allman Brothers Band", bpm: 116, beatsPerLine: 8 },
  { title: "Midnight Rider", artist: "Allman Brothers Band", bpm: 108, beatsPerLine: 8 },
  { title: "Melissa", artist: "Allman Brothers Band", bpm: 80, beatsPerLine: 8 },

  // === George Jones ===
  { title: "He Stopped Loving Her Today", artist: "George Jones", bpm: 72, beatsPerLine: 8 },
  { title: "The Grand Tour", artist: "George Jones", bpm: 80, beatsPerLine: 8 },
  { title: "White Lightning", artist: "George Jones", bpm: 160, beatsPerLine: 8 },
  { title: "She Thinks I Still Care", artist: "George Jones", bpm: 100, beatsPerLine: 8 },
  { title: "A Picture of Me Without You", artist: "George Jones", bpm: 84, beatsPerLine: 8 },
  { title: "The Race Is On", artist: "George Jones", bpm: 168, beatsPerLine: 8 },
  { title: "Who's Gonna Fill Their Shoes", artist: "George Jones", bpm: 76, beatsPerLine: 8 },
  { title: "Still Doin' Time", artist: "George Jones", bpm: 88, beatsPerLine: 8 },
  { title: "Bartender's Blues", artist: "George Jones", bpm: 72, beatsPerLine: 8 },

  // === Buck Owens ===
  { title: "Act Naturally", artist: "Buck Owens", bpm: 128, beatsPerLine: 8 },
  { title: "Tiger by the Tail", artist: "Buck Owens", bpm: 148, beatsPerLine: 8 },
  { title: "Together Again", artist: "Buck Owens", bpm: 100, beatsPerLine: 8 },
  { title: "Love's Gonna Live Here", artist: "Buck Owens", bpm: 140, beatsPerLine: 8 },
  { title: "Waitin' in Your Welfare Line", artist: "Buck Owens", bpm: 136, beatsPerLine: 8 },
  { title: "Streets of Bakersfield", artist: "Buck Owens & Dwight Yoakam", bpm: 116, beatsPerLine: 8 },

  // === Dwight Yoakam ===
  { title: "Guitars, Cadillacs", artist: "Dwight Yoakam", bpm: 132, beatsPerLine: 8 },
  { title: "Honky Tonk Man", artist: "Dwight Yoakam", bpm: 144, beatsPerLine: 8 },
  { title: "Fast as You", artist: "Dwight Yoakam", bpm: 136, beatsPerLine: 8 },
  { title: "A Thousand Miles from Nowhere", artist: "Dwight Yoakam", bpm: 96, beatsPerLine: 8 },
  { title: "I Sang Dixie", artist: "Dwight Yoakam", bpm: 80, beatsPerLine: 8 },
  { title: "Little Sister", artist: "Dwight Yoakam", bpm: 160, beatsPerLine: 8 },
  { title: "Ain't That Lonely Yet", artist: "Dwight Yoakam", bpm: 108, beatsPerLine: 8 },
  { title: "Turn It On, Turn It Up, Turn Me Loose", artist: "Dwight Yoakam", bpm: 140, beatsPerLine: 8 },

  // === Steve Earle ===
  { title: "Guitar Town", artist: "Steve Earle", bpm: 120, beatsPerLine: 8 },
  { title: "Copperhead Road", artist: "Steve Earle", bpm: 132, beatsPerLine: 8 },
  { title: "Galway Girl", artist: "Steve Earle", bpm: 140, beatsPerLine: 8 },
  { title: "Someday", artist: "Steve Earle", bpm: 96, beatsPerLine: 8 },
  { title: "Goodbye's All We've Got Left", artist: "Steve Earle", bpm: 84, beatsPerLine: 8 },
  { title: "The Devil's Right Hand", artist: "Steve Earle", bpm: 108, beatsPerLine: 8 },
  { title: "Fort Worth Blues", artist: "Steve Earle", bpm: 76, beatsPerLine: 8 },
  { title: "Hillbilly Highway", artist: "Steve Earle", bpm: 112, beatsPerLine: 8 },

  // === Emmylou Harris ===
  { title: "Together Again", artist: "Emmylou Harris", bpm: 100, beatsPerLine: 8 },
  { title: "If I Could Only Win Your Love", artist: "Emmylou Harris", bpm: 108, beatsPerLine: 8 },
  { title: "Two More Bottles of Wine", artist: "Emmylou Harris", bpm: 128, beatsPerLine: 8 },
  { title: "Born to Run", artist: "Emmylou Harris", bpm: 108, beatsPerLine: 8 },
  { title: "Making Believe", artist: "Emmylou Harris", bpm: 88, beatsPerLine: 8 },
  { title: "Boulder to Birmingham", artist: "Emmylou Harris", bpm: 96, beatsPerLine: 8 },

  // === Gram Parsons ===
  { title: "Return of the Grievous Angel", artist: "Gram Parsons", bpm: 112, beatsPerLine: 8 },
  { title: "Hickory Wind", artist: "Gram Parsons", bpm: 72, beatsPerLine: 8 },
  { title: "Sin City", artist: "Gram Parsons", bpm: 84, beatsPerLine: 8 },
  { title: "Love Hurts", artist: "Gram Parsons & Emmylou Harris", bpm: 72, beatsPerLine: 8 },
  { title: "Ooh Las Vegas", artist: "Gram Parsons", bpm: 120, beatsPerLine: 8 },
  { title: "Hot Burrito #1", artist: "Flying Burrito Brothers", bpm: 72, beatsPerLine: 8 },
  { title: "Hot Burrito #2", artist: "Flying Burrito Brothers", bpm: 108, beatsPerLine: 8 },
  { title: "Christine's Tune", artist: "Flying Burrito Brothers", bpm: 132, beatsPerLine: 8 },

  // === Roger Miller ===
  { title: "King of the Road", artist: "Roger Miller", bpm: 120, beatsPerLine: 8 },
  { title: "Dang Me", artist: "Roger Miller", bpm: 132, beatsPerLine: 8 },
  { title: "England Swings", artist: "Roger Miller", bpm: 120, beatsPerLine: 8 },

  // === Bobby Bare ===
  { title: "Detroit City", artist: "Bobby Bare", bpm: 80, beatsPerLine: 8 },
  { title: "500 Miles Away from Home", artist: "Bobby Bare", bpm: 84, beatsPerLine: 8 },
  { title: "Marie Laveau", artist: "Bobby Bare", bpm: 108, beatsPerLine: 8 },

  // === Patsy Cline ===
  { title: "Crazy", artist: "Patsy Cline", bpm: 72, beatsPerLine: 8 },
  { title: "I Fall to Pieces", artist: "Patsy Cline", bpm: 80, beatsPerLine: 8 },
  { title: "Walkin' After Midnight", artist: "Patsy Cline", bpm: 100, beatsPerLine: 8 },
  { title: "Sweet Dreams", artist: "Patsy Cline", bpm: 72, beatsPerLine: 8 },
  { title: "She's Got You", artist: "Patsy Cline", bpm: 80, beatsPerLine: 8 },

  // === Loretta Lynn ===
  { title: "Coal Miner's Daughter", artist: "Loretta Lynn", bpm: 104, beatsPerLine: 8 },
  { title: "You Ain't Woman Enough", artist: "Loretta Lynn", bpm: 120, beatsPerLine: 8 },
  { title: "Don't Come Home A-Drinkin'", artist: "Loretta Lynn", bpm: 108, beatsPerLine: 8 },
  { title: "Fist City", artist: "Loretta Lynn", bpm: 128, beatsPerLine: 8 },
  { title: "The Pill", artist: "Loretta Lynn", bpm: 112, beatsPerLine: 8 },
  { title: "Rated X", artist: "Loretta Lynn", bpm: 108, beatsPerLine: 8 },

  // === Tammy Wynette ===
  { title: "Stand by Your Man", artist: "Tammy Wynette", bpm: 66, beatsPerLine: 8 },
  { title: "D-I-V-O-R-C-E", artist: "Tammy Wynette", bpm: 100, beatsPerLine: 8 },
  { title: "Golden Ring", artist: "George Jones & Tammy Wynette", bpm: 92, beatsPerLine: 8 },

  // === Dolly Parton ===
  { title: "Jolene", artist: "Dolly Parton", bpm: 112, beatsPerLine: 8 },
  { title: "9 to 5", artist: "Dolly Parton", bpm: 120, beatsPerLine: 8 },
  { title: "Coat of Many Colors", artist: "Dolly Parton", bpm: 100, beatsPerLine: 8 },
  { title: "I Will Always Love You", artist: "Dolly Parton", bpm: 66, beatsPerLine: 8 },
  { title: "Islands in the Stream", artist: "Kenny Rogers & Dolly Parton", bpm: 100, beatsPerLine: 8 },
  { title: "Here You Come Again", artist: "Dolly Parton", bpm: 120, beatsPerLine: 8 },
  { title: "Two Doors Down", artist: "Dolly Parton", bpm: 128, beatsPerLine: 8 },

  // === Kenny Rogers ===
  { title: "The Gambler", artist: "Kenny Rogers", bpm: 92, beatsPerLine: 8 },
  { title: "Lucille", artist: "Kenny Rogers", bpm: 108, beatsPerLine: 8 },
  { title: "Coward of the County", artist: "Kenny Rogers", bpm: 100, beatsPerLine: 8 },
  { title: "Ruby, Don't Take Your Love to Town", artist: "Kenny Rogers", bpm: 96, beatsPerLine: 8 },

  // === Glen Campbell ===
  { title: "Gentle on My Mind", artist: "Glen Campbell", bpm: 112, beatsPerLine: 8 },
  { title: "Rhinestone Cowboy", artist: "Glen Campbell", bpm: 108, beatsPerLine: 8 },
  { title: "Wichita Lineman", artist: "Glen Campbell", bpm: 80, beatsPerLine: 8 },
  { title: "Galveston", artist: "Glen Campbell", bpm: 76, beatsPerLine: 8 },
  { title: "By the Time I Get to Phoenix", artist: "Glen Campbell", bpm: 72, beatsPerLine: 8 },
  { title: "Southern Nights", artist: "Glen Campbell", bpm: 108, beatsPerLine: 8 },

  // === Marty Robbins ===
  { title: "El Paso", artist: "Marty Robbins", bpm: 168, beatsPerLine: 8 },
  { title: "Big Iron", artist: "Marty Robbins", bpm: 140, beatsPerLine: 8 },
  { title: "Devil Woman", artist: "Marty Robbins", bpm: 108, beatsPerLine: 8 },
  { title: "A White Sport Coat", artist: "Marty Robbins", bpm: 80, beatsPerLine: 8 },

  // === John Denver ===
  { title: "Take Me Home, Country Roads", artist: "John Denver", bpm: 82, beatsPerLine: 8 },
  { title: "Rocky Mountain High", artist: "John Denver", bpm: 76, beatsPerLine: 8 },
  { title: "Sunshine on My Shoulders", artist: "John Denver", bpm: 72, beatsPerLine: 8 },
  { title: "Annie's Song", artist: "John Denver", bpm: 76, beatsPerLine: 8 },
  { title: "Thank God I'm a Country Boy", artist: "John Denver", bpm: 120, beatsPerLine: 8 },
  { title: "Leaving on a Jet Plane", artist: "John Denver", bpm: 84, beatsPerLine: 8 },

  // === George Strait ===
  { title: "Amarillo by Morning", artist: "George Strait", bpm: 96, beatsPerLine: 8 },
  { title: "Check Yes or No", artist: "George Strait", bpm: 120, beatsPerLine: 8 },
  { title: "The Chair", artist: "George Strait", bpm: 76, beatsPerLine: 8 },
  { title: "Fool Hearted Memory", artist: "George Strait", bpm: 88, beatsPerLine: 8 },
  { title: "Ocean Front Property", artist: "George Strait", bpm: 76, beatsPerLine: 8 },
  { title: "All My Ex's Live in Texas", artist: "George Strait", bpm: 108, beatsPerLine: 8 },
  { title: "Troubadour", artist: "George Strait", bpm: 100, beatsPerLine: 8 },
  { title: "Does Fort Worth Ever Cross Your Mind", artist: "George Strait", bpm: 92, beatsPerLine: 8 },

  // === Alan Jackson ===
  { title: "Chattahoochee", artist: "Alan Jackson", bpm: 138, beatsPerLine: 8 },
  { title: "Drive", artist: "Alan Jackson", bpm: 84, beatsPerLine: 8 },
  { title: "Don't Rock the Jukebox", artist: "Alan Jackson", bpm: 128, beatsPerLine: 8 },
  { title: "Here in the Real World", artist: "Alan Jackson", bpm: 80, beatsPerLine: 8 },
  { title: "Gone Country", artist: "Alan Jackson", bpm: 100, beatsPerLine: 8 },

  // === Garth Brooks ===
  { title: "Friends in Low Places", artist: "Garth Brooks", bpm: 82, beatsPerLine: 8 },
  { title: "The Dance", artist: "Garth Brooks", bpm: 68, beatsPerLine: 8 },
  { title: "The Thunder Rolls", artist: "Garth Brooks", bpm: 76, beatsPerLine: 8 },
  { title: "Rodeo", artist: "Garth Brooks", bpm: 132, beatsPerLine: 8 },
  { title: "Much Too Young (to Feel This Damn Old)", artist: "Garth Brooks", bpm: 92, beatsPerLine: 8 },
  { title: "Ain't Goin' Down ('Til the Sun Comes Up)", artist: "Garth Brooks", bpm: 168, beatsPerLine: 8 },

  // === Travis Tritt ===
  { title: "T-R-O-U-B-L-E", artist: "Travis Tritt", bpm: 140, beatsPerLine: 8 },
  { title: "It's a Great Day to Be Alive", artist: "Travis Tritt", bpm: 100, beatsPerLine: 8 },
  { title: "Here's a Quarter (Call Someone Who Cares)", artist: "Travis Tritt", bpm: 92, beatsPerLine: 8 },
  { title: "Anymore", artist: "Travis Tritt", bpm: 76, beatsPerLine: 8 },

  // === Brooks & Dunn ===
  { title: "Boot Scootin' Boogie", artist: "Brooks & Dunn", bpm: 132, beatsPerLine: 8 },
  { title: "Neon Moon", artist: "Brooks & Dunn", bpm: 76, beatsPerLine: 8 },
  { title: "Brand New Man", artist: "Brooks & Dunn", bpm: 112, beatsPerLine: 8 },
  { title: "My Maria", artist: "Brooks & Dunn", bpm: 100, beatsPerLine: 8 },

  // === Alabama ===
  { title: "Mountain Music", artist: "Alabama", bpm: 128, beatsPerLine: 8 },
  { title: "Song of the South", artist: "Alabama", bpm: 108, beatsPerLine: 8 },
  { title: "Dixieland Delight", artist: "Alabama", bpm: 132, beatsPerLine: 8 },
  { title: "If You're Gonna Play in Texas", artist: "Alabama", bpm: 120, beatsPerLine: 8 },

  // === Outlaw / Alt-Country Modern ===
  { title: "Whiskey Myers", artist: "Whiskey Myers", bpm: 92, beatsPerLine: 8 },
  { title: "Ballad of a Southern Man", artist: "Whiskey Myers", bpm: 100, beatsPerLine: 8 },
  { title: "Virginia", artist: "Whiskey Myers", bpm: 76, beatsPerLine: 8 },
  { title: "Stone", artist: "Whiskey Myers", bpm: 84, beatsPerLine: 8 },
  { title: "Broken Window Serenade", artist: "Whiskey Myers", bpm: 80, beatsPerLine: 8 },

  // === Sturgill Simpson ===
  { title: "Turtles All the Way Down", artist: "Sturgill Simpson", bpm: 88, beatsPerLine: 8 },
  { title: "Long White Line", artist: "Sturgill Simpson", bpm: 108, beatsPerLine: 8 },
  { title: "Living the Dream", artist: "Sturgill Simpson", bpm: 100, beatsPerLine: 8 },
  { title: "Life of Sin", artist: "Sturgill Simpson", bpm: 96, beatsPerLine: 8 },
  { title: "I Don't Mind", artist: "Sturgill Simpson", bpm: 76, beatsPerLine: 8 },

  // === Chris Stapleton ===
  { title: "Tennessee Whiskey", artist: "Chris Stapleton", bpm: 64, beatsPerLine: 8 },
  { title: "Parachute", artist: "Chris Stapleton", bpm: 76, beatsPerLine: 8 },
  { title: "Fire Away", artist: "Chris Stapleton", bpm: 72, beatsPerLine: 8 },
  { title: "Traveller", artist: "Chris Stapleton", bpm: 84, beatsPerLine: 8 },
  { title: "Broken Halos", artist: "Chris Stapleton", bpm: 96, beatsPerLine: 8 },
  { title: "Whiskey and You", artist: "Chris Stapleton", bpm: 72, beatsPerLine: 8 },
  { title: "Millionaire", artist: "Chris Stapleton", bpm: 80, beatsPerLine: 8 },
  { title: "Starting Over", artist: "Chris Stapleton", bpm: 88, beatsPerLine: 8 },

  // === Tyler Childers ===
  { title: "Feathered Indians", artist: "Tyler Childers", bpm: 92, beatsPerLine: 8 },
  { title: "Whitehouse Road", artist: "Tyler Childers", bpm: 108, beatsPerLine: 8 },
  { title: "Lady May", artist: "Tyler Childers", bpm: 76, beatsPerLine: 8 },
  { title: "Nose on the Grindstone", artist: "Tyler Childers", bpm: 100, beatsPerLine: 8 },
  { title: "Follow You to Virgie", artist: "Tyler Childers", bpm: 80, beatsPerLine: 8 },
  { title: "Shake the Frost", artist: "Tyler Childers", bpm: 96, beatsPerLine: 8 },

  // === Colter Wall ===
  { title: "Sleeping on the Blacktop", artist: "Colter Wall", bpm: 88, beatsPerLine: 8 },
  { title: "Kate McCannon", artist: "Colter Wall", bpm: 80, beatsPerLine: 8 },
  { title: "Thirteen Silver Dollars", artist: "Colter Wall", bpm: 96, beatsPerLine: 8 },
  { title: "Big Iron", artist: "Colter Wall", bpm: 140, beatsPerLine: 8 },
  { title: "The Devil Wears a Suit and Tie", artist: "Colter Wall", bpm: 84, beatsPerLine: 8 },

  // === Jason Isbell ===
  { title: "Cover Me Up", artist: "Jason Isbell", bpm: 76, beatsPerLine: 8 },
  { title: "24 Frames", artist: "Jason Isbell", bpm: 108, beatsPerLine: 8 },
  { title: "Elephant", artist: "Jason Isbell", bpm: 88, beatsPerLine: 8 },
  { title: "Dress Blues", artist: "Jason Isbell", bpm: 72, beatsPerLine: 8 },
  { title: "If We Were Vampires", artist: "Jason Isbell", bpm: 76, beatsPerLine: 8 },
  { title: "Alabama Pines", artist: "Jason Isbell", bpm: 92, beatsPerLine: 8 },
  { title: "Travelling Alone", artist: "Jason Isbell", bpm: 100, beatsPerLine: 8 },

  // === Cody Jinks ===
  { title: "Hippies and Cowboys", artist: "Cody Jinks", bpm: 92, beatsPerLine: 8 },
  { title: "Loud and Heavy", artist: "Cody Jinks", bpm: 84, beatsPerLine: 8 },
  { title: "Must Be the Whiskey", artist: "Cody Jinks", bpm: 96, beatsPerLine: 8 },
  { title: "Cast No Stones", artist: "Cody Jinks", bpm: 72, beatsPerLine: 8 },
  { title: "David", artist: "Cody Jinks", bpm: 80, beatsPerLine: 8 },

  // === Turnpike Troubadours ===
  { title: "Gin, Smoke, Lies", artist: "Turnpike Troubadours", bpm: 108, beatsPerLine: 8 },
  { title: "Good Lord Lorrie", artist: "Turnpike Troubadours", bpm: 116, beatsPerLine: 8 },
  { title: "Diamonds & Gasoline", artist: "Turnpike Troubadours", bpm: 100, beatsPerLine: 8 },
  { title: "Every Girl", artist: "Turnpike Troubadours", bpm: 92, beatsPerLine: 8 },

  // === Jamey Johnson ===
  { title: "In Color", artist: "Jamey Johnson", bpm: 72, beatsPerLine: 8 },
  { title: "High Cost of Living", artist: "Jamey Johnson", bpm: 96, beatsPerLine: 8 },
  { title: "Lead Me Home", artist: "Jamey Johnson", bpm: 80, beatsPerLine: 8 },
  { title: "Between Jennings and Jones", artist: "Jamey Johnson", bpm: 88, beatsPerLine: 8 },

  // === Whitey Morgan ===
  { title: "Honky Tonk Hell", artist: "Whitey Morgan", bpm: 112, beatsPerLine: 8 },
  { title: "I'm on Fire", artist: "Whitey Morgan", bpm: 100, beatsPerLine: 8 },
  { title: "Sinner", artist: "Whitey Morgan", bpm: 96, beatsPerLine: 8 },

  // === Dale Watson ===
  { title: "Cheatin' Heart Attack", artist: "Dale Watson", bpm: 120, beatsPerLine: 8 },
  { title: "I Lie When I Drink", artist: "Dale Watson", bpm: 128, beatsPerLine: 8 },
  { title: "A Real Country Song", artist: "Dale Watson", bpm: 108, beatsPerLine: 8 },

  // === Shooter Jennings ===
  { title: "4th of July", artist: "Shooter Jennings", bpm: 96, beatsPerLine: 8 },
  { title: "Put the O Back in Country", artist: "Shooter Jennings", bpm: 120, beatsPerLine: 8 },
  { title: "Gone to Carolina", artist: "Shooter Jennings", bpm: 100, beatsPerLine: 8 },

  // === Lucinda Williams ===
  { title: "Passionate Kisses", artist: "Lucinda Williams", bpm: 116, beatsPerLine: 8 },
  { title: "Car Wheels on a Gravel Road", artist: "Lucinda Williams", bpm: 108, beatsPerLine: 8 },
  { title: "Changed the Locks", artist: "Lucinda Williams", bpm: 120, beatsPerLine: 8 },

  // === Ryan Bingham ===
  { title: "Southside of Heaven", artist: "Ryan Bingham", bpm: 92, beatsPerLine: 8 },
  { title: "The Weary Kind", artist: "Ryan Bingham", bpm: 80, beatsPerLine: 8 },
  { title: "Bread & Water", artist: "Ryan Bingham", bpm: 100, beatsPerLine: 8 },

  // === Margo Price ===
  { title: "Hurtin' (on the Bottle)", artist: "Margo Price", bpm: 120, beatsPerLine: 8 },
  { title: "Hands of Time", artist: "Margo Price", bpm: 84, beatsPerLine: 8 },
  { title: "Tennessee Song", artist: "Margo Price", bpm: 96, beatsPerLine: 8 },

  // === Robert Earl Keen ===
  { title: "The Road Goes on Forever", artist: "Robert Earl Keen", bpm: 108, beatsPerLine: 8 },
  { title: "Gringo Honeymoon", artist: "Robert Earl Keen", bpm: 96, beatsPerLine: 8 },
  { title: "Corpus Christi Bay", artist: "Robert Earl Keen", bpm: 80, beatsPerLine: 8 },
  { title: "Merry Christmas from the Family", artist: "Robert Earl Keen", bpm: 112, beatsPerLine: 8 },
  { title: "Feelin' Good Again", artist: "Robert Earl Keen", bpm: 120, beatsPerLine: 8 },

  // === Ray Wylie Hubbard ===
  { title: "Redneck Mother", artist: "Ray Wylie Hubbard", bpm: 120, beatsPerLine: 8 },
  { title: "Snake Farm", artist: "Ray Wylie Hubbard", bpm: 108, beatsPerLine: 8 },
  { title: "Screw You, We're from Texas", artist: "Ray Wylie Hubbard", bpm: 116, beatsPerLine: 8 },

  // === Lyle Lovett ===
  { title: "If I Had a Boat", artist: "Lyle Lovett", bpm: 84, beatsPerLine: 8 },
  { title: "That's Right (You're Not from Texas)", artist: "Lyle Lovett", bpm: 108, beatsPerLine: 8 },
  { title: "Cowboy Man", artist: "Lyle Lovett", bpm: 120, beatsPerLine: 8 },

  // === Joe Ely ===
  { title: "Boxcars", artist: "Joe Ely", bpm: 120, beatsPerLine: 8 },
  { title: "Letter to Laredo", artist: "Joe Ely", bpm: 100, beatsPerLine: 8 },
  { title: "Fingernails", artist: "Joe Ely", bpm: 132, beatsPerLine: 8 },

  // === Jimmie Dale Gilmore ===
  { title: "Dallas", artist: "Jimmie Dale Gilmore", bpm: 100, beatsPerLine: 8 },
  { title: "Tonight I Think I'm Gonna Go Downtown", artist: "Jimmie Dale Gilmore", bpm: 88, beatsPerLine: 8 },

  // === Butch Hancock ===
  { title: "If You Were a Bluebird", artist: "Butch Hancock", bpm: 92, beatsPerLine: 8 },
  { title: "She Never Spoke Spanish to Me", artist: "Butch Hancock", bpm: 100, beatsPerLine: 8 },

  // === Gary Stewart ===
  { title: "She's Actin' Single (I'm Drinkin' Doubles)", artist: "Gary Stewart", bpm: 128, beatsPerLine: 8 },
  { title: "Drinkin' Thing", artist: "Gary Stewart", bpm: 92, beatsPerLine: 8 },
  { title: "Out of Hand", artist: "Gary Stewart", bpm: 120, beatsPerLine: 8 },

  // === Moe Bandy ===
  { title: "Bandy the Rodeo Clown", artist: "Moe Bandy", bpm: 100, beatsPerLine: 8 },
  { title: "Hank Williams, You Wrote My Life", artist: "Moe Bandy", bpm: 96, beatsPerLine: 8 },

  // === Lefty Frizzell ===
  { title: "If You've Got the Money I've Got the Time", artist: "Lefty Frizzell", bpm: 140, beatsPerLine: 8 },
  { title: "Long Black Veil", artist: "Lefty Frizzell", bpm: 84, beatsPerLine: 8 },
  { title: "Saginaw, Michigan", artist: "Lefty Frizzell", bpm: 100, beatsPerLine: 8 },

  // === Webb Pierce ===
  { title: "There Stands the Glass", artist: "Webb Pierce", bpm: 120, beatsPerLine: 8 },
  { title: "In the Jailhouse Now", artist: "Webb Pierce", bpm: 136, beatsPerLine: 8 },

  // === Ernest Tubb ===
  { title: "Walkin' the Floor Over You", artist: "Ernest Tubb", bpm: 128, beatsPerLine: 8 },
  { title: "Thanks a Lot", artist: "Ernest Tubb", bpm: 108, beatsPerLine: 8 },

  // === Faron Young ===
  { title: "Hello Walls", artist: "Faron Young", bpm: 108, beatsPerLine: 8 },
  { title: "It's Four in the Morning", artist: "Faron Young", bpm: 80, beatsPerLine: 8 },

  // === Jim Reeves ===
  { title: "He'll Have to Go", artist: "Jim Reeves", bpm: 72, beatsPerLine: 8 },
  { title: "Welcome to My World", artist: "Jim Reeves", bpm: 76, beatsPerLine: 8 },

  // === Don Williams ===
  { title: "Tulsa Time", artist: "Don Williams", bpm: 120, beatsPerLine: 8 },
  { title: "I Believe in You", artist: "Don Williams", bpm: 84, beatsPerLine: 8 },
  { title: "Good Ole Boys Like Me", artist: "Don Williams", bpm: 88, beatsPerLine: 8 },
  { title: "Amanda", artist: "Don Williams", bpm: 80, beatsPerLine: 8 },

  // === Vince Gill ===
  { title: "When I Call Your Name", artist: "Vince Gill", bpm: 76, beatsPerLine: 8 },
  { title: "Go Rest High on That Mountain", artist: "Vince Gill", bpm: 68, beatsPerLine: 8 },
  { title: "One More Last Chance", artist: "Vince Gill", bpm: 120, beatsPerLine: 8 },

  // === Randy Travis ===
  { title: "Forever and Ever, Amen", artist: "Randy Travis", bpm: 80, beatsPerLine: 8 },
  { title: "Diggin' Up Bones", artist: "Randy Travis", bpm: 116, beatsPerLine: 8 },
  { title: "On the Other Hand", artist: "Randy Travis", bpm: 80, beatsPerLine: 8 },

  // === Keith Whitley ===
  { title: "Don't Close Your Eyes", artist: "Keith Whitley", bpm: 80, beatsPerLine: 8 },
  { title: "When You Say Nothing at All", artist: "Keith Whitley", bpm: 84, beatsPerLine: 8 },
  { title: "I'm No Stranger to the Rain", artist: "Keith Whitley", bpm: 88, beatsPerLine: 8 },

  // === Conway Twitty ===
  { title: "Hello Darlin'", artist: "Conway Twitty", bpm: 72, beatsPerLine: 8 },
  { title: "Tight Fittin' Jeans", artist: "Conway Twitty", bpm: 96, beatsPerLine: 8 },
  { title: "It's Only Make Believe", artist: "Conway Twitty", bpm: 76, beatsPerLine: 8 },

  // === Charley Pride ===
  { title: "Kiss an Angel Good Mornin'", artist: "Charley Pride", bpm: 112, beatsPerLine: 8 },
  { title: "Is Anybody Goin' to San Antone", artist: "Charley Pride", bpm: 100, beatsPerLine: 8 },

  // === Tanya Tucker ===
  { title: "Delta Dawn", artist: "Tanya Tucker", bpm: 100, beatsPerLine: 8 },
  { title: "Texas (When I Die)", artist: "Tanya Tucker", bpm: 108, beatsPerLine: 8 },

  // === Chris LeDoux ===
  { title: "This Cowboy's Hat", artist: "Chris LeDoux", bpm: 92, beatsPerLine: 8 },
  { title: "Whatcha Gonna Do with a Cowboy", artist: "Chris LeDoux", bpm: 108, beatsPerLine: 8 },
  { title: "Look at You Girl", artist: "Chris LeDoux", bpm: 96, beatsPerLine: 8 },

  // === Billy Ray Cyrus ===
  { title: "Achy Breaky Heart", artist: "Billy Ray Cyrus", bpm: 120, beatsPerLine: 8 },

  // === Toby Keith ===
  { title: "Should've Been a Cowboy", artist: "Toby Keith", bpm: 108, beatsPerLine: 8 },
  { title: "Beer for My Horses", artist: "Toby Keith & Willie Nelson", bpm: 96, beatsPerLine: 8 },
  { title: "How Do You Like Me Now", artist: "Toby Keith", bpm: 120, beatsPerLine: 8 },
  { title: "Red Solo Cup", artist: "Toby Keith", bpm: 132, beatsPerLine: 8 },

  // === Eric Church ===
  { title: "Springsteen", artist: "Eric Church", bpm: 100, beatsPerLine: 8 },
  { title: "Drink in My Hand", artist: "Eric Church", bpm: 120, beatsPerLine: 8 },
  { title: "Talladega", artist: "Eric Church", bpm: 96, beatsPerLine: 8 },
  { title: "The Outsiders", artist: "Eric Church", bpm: 140, beatsPerLine: 8 },
  { title: "Record Year", artist: "Eric Church", bpm: 108, beatsPerLine: 8 },

  // === Zac Brown Band ===
  { title: "Chicken Fried", artist: "Zac Brown Band", bpm: 96, beatsPerLine: 8 },
  { title: "Toes", artist: "Zac Brown Band", bpm: 112, beatsPerLine: 8 },
  { title: "Colder Weather", artist: "Zac Brown Band", bpm: 80, beatsPerLine: 8 },
  { title: "Free", artist: "Zac Brown Band", bpm: 76, beatsPerLine: 8 },

  // === Luke Combs ===
  { title: "Hurricane", artist: "Luke Combs", bpm: 100, beatsPerLine: 8 },
  { title: "When It Rains It Pours", artist: "Luke Combs", bpm: 108, beatsPerLine: 8 },
  { title: "Beautiful Crazy", artist: "Luke Combs", bpm: 76, beatsPerLine: 8 },
  { title: "Beer Never Broke My Heart", artist: "Luke Combs", bpm: 112, beatsPerLine: 8 },

  // === Morgan Wallen ===
  { title: "Whiskey Glasses", artist: "Morgan Wallen", bpm: 108, beatsPerLine: 8 },
  { title: "Cover Me Up", artist: "Morgan Wallen", bpm: 76, beatsPerLine: 8 },
  { title: "Wasted on You", artist: "Morgan Wallen", bpm: 80, beatsPerLine: 8 },

  // === Charley Crockett ===
  { title: "Welcome to Hard Times", artist: "Charley Crockett", bpm: 108, beatsPerLine: 8 },
  { title: "Jamestown Ferry", artist: "Charley Crockett", bpm: 96, beatsPerLine: 8 },
  { title: "I Need Your Love", artist: "Charley Crockett", bpm: 120, beatsPerLine: 8 },
  { title: "Trinity River", artist: "Charley Crockett", bpm: 100, beatsPerLine: 8 },

  // === Blaze Foley ===
  { title: "Clay Pigeons", artist: "Blaze Foley", bpm: 80, beatsPerLine: 8 },
  { title: "If I Could Only Fly", artist: "Blaze Foley", bpm: 84, beatsPerLine: 8 },
  { title: "Election Day", artist: "Blaze Foley", bpm: 96, beatsPerLine: 8 },

  // === John Prine ===
  { title: "Angel from Montgomery", artist: "John Prine", bpm: 80, beatsPerLine: 8 },
  { title: "Sam Stone", artist: "John Prine", bpm: 88, beatsPerLine: 8 },
  { title: "Paradise", artist: "John Prine", bpm: 100, beatsPerLine: 8 },
  { title: "In Spite of Ourselves", artist: "John Prine", bpm: 108, beatsPerLine: 8 },
  { title: "Illegal Smile", artist: "John Prine", bpm: 120, beatsPerLine: 8 },
  { title: "That's the Way the World Goes 'Round", artist: "John Prine", bpm: 112, beatsPerLine: 8 },
  { title: "Speed of the Sound of Loneliness", artist: "John Prine", bpm: 96, beatsPerLine: 8 },

  // === Todd Snider ===
  { title: "Beer Run", artist: "Todd Snider", bpm: 120, beatsPerLine: 8 },
  { title: "Alright Guy", artist: "Todd Snider", bpm: 96, beatsPerLine: 8 },
  { title: "Conservative Christian, Right Wing Republican", artist: "Todd Snider", bpm: 108, beatsPerLine: 8 },

  // === Old Crow Medicine Show ===
  { title: "Wagon Wheel", artist: "Old Crow Medicine Show", bpm: 132, beatsPerLine: 8 },
  { title: "Tell It to Me", artist: "Old Crow Medicine Show", bpm: 140, beatsPerLine: 8 },

  // === Hayes Carll ===
  { title: "She Left Me for Jesus", artist: "Hayes Carll", bpm: 96, beatsPerLine: 8 },
  { title: "KMAG YOYO", artist: "Hayes Carll", bpm: 112, beatsPerLine: 8 },

  // === Cross Canadian Ragweed ===
  { title: "17", artist: "Cross Canadian Ragweed", bpm: 88, beatsPerLine: 8 },
  { title: "Boys from Oklahoma", artist: "Cross Canadian Ragweed", bpm: 100, beatsPerLine: 8 },

  // === Pat Green ===
  { title: "Wave on Wave", artist: "Pat Green", bpm: 84, beatsPerLine: 8 },
  { title: "Songs About Texas", artist: "Pat Green", bpm: 96, beatsPerLine: 8 },

  // === Jack Ingram ===
  { title: "Wherever You Are", artist: "Jack Ingram", bpm: 80, beatsPerLine: 8 },

  // === Zach Bryan ===
  { title: "Something in the Orange", artist: "Zach Bryan", bpm: 80, beatsPerLine: 8 },
  { title: "Heading South", artist: "Zach Bryan", bpm: 96, beatsPerLine: 8 },
  { title: "Condemned", artist: "Zach Bryan", bpm: 88, beatsPerLine: 8 },
  { title: "Revival", artist: "Zach Bryan", bpm: 92, beatsPerLine: 8 },
  { title: "Oklahoma Smokeshow", artist: "Zach Bryan", bpm: 100, beatsPerLine: 8 },

  // === Sierra Ferrell ===
  { title: "In Dreams", artist: "Sierra Ferrell", bpm: 92, beatsPerLine: 8 },
  { title: "West Virginia Waltz", artist: "Sierra Ferrell", bpm: 100, beatsPerLine: 8 },

  // === Benjamin Tod / Lost Dog Street Band ===
  { title: "I Am a Stranger", artist: "Lost Dog Street Band", bpm: 80, beatsPerLine: 8 },
  { title: "September Doves", artist: "Lost Dog Street Band", bpm: 76, beatsPerLine: 8 },

  // === Misc Classic Country Standards ===
  { title: "Flowers on the Wall", artist: "Statler Brothers", bpm: 112, beatsPerLine: 8 },
  { title: "Pancho and Lefty", artist: "Willie Nelson & Merle Haggard", bpm: 96, beatsPerLine: 8 },
  { title: "Good Year for the Roses", artist: "George Jones", bpm: 80, beatsPerLine: 8 },
  { title: "The Wanderer", artist: "Eddie Rabbitt", bpm: 128, beatsPerLine: 8 },
  { title: "I Love a Rainy Night", artist: "Eddie Rabbitt", bpm: 132, beatsPerLine: 8 },
  { title: "Behind Closed Doors", artist: "Charlie Rich", bpm: 80, beatsPerLine: 8 },
  { title: "The Most Beautiful Girl", artist: "Charlie Rich", bpm: 76, beatsPerLine: 8 },
  { title: "Elvira", artist: "Oak Ridge Boys", bpm: 120, beatsPerLine: 8 },
  { title: "Amanda", artist: "Waylon Jennings", bpm: 80, beatsPerLine: 8 },
  { title: "Help Me Make It Through the Night", artist: "Sammi Smith", bpm: 72, beatsPerLine: 8 },
  { title: "Blanket on the Ground", artist: "Billie Jo Spears", bpm: 108, beatsPerLine: 8 },
  { title: "Harper Valley PTA", artist: "Jeannie C. Riley", bpm: 132, beatsPerLine: 8 },
  { title: "Jackson", artist: "Johnny Cash & June Carter", bpm: 120, beatsPerLine: 8 },
  { title: "Ode to Billie Joe", artist: "Bobbie Gentry", bpm: 96, beatsPerLine: 8 }
];
