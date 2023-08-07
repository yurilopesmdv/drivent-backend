-- CreateTable
CREATE TABLE "Activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "startsAt" TIMESTAMP NOT NULL,
    "endsAt" TIMESTAMP NOT NULL,
    "vacancy" INTEGER NOT NULL,
    "location" INTEGER,

    CONSTRAINT "Activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitiesLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ActivitiesLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySubscription" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER,
    "ticketId" INTEGER,

    CONSTRAINT "ActivitySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivitiesLocation_name_key" ON "ActivitiesLocation"("name");

-- CreateIndex
CREATE INDEX "Activities_date_idx" ON "Activities"("date");

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_location_fkey" FOREIGN KEY ("location") REFERENCES "ActivitiesLocation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivitySubscription" ADD CONSTRAINT "ActivitySubscription_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivitySubscription" ADD CONSTRAINT "ActivitySubscription_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
