-- Add GroupPerson junction table for many-to-many relationship between Group and Person

-- CreateTable
CREATE TABLE "GroupPerson" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "GroupPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupPerson_groupId_personId_key" ON "GroupPerson"("groupId", "personId");

-- CreateIndex
CREATE INDEX "GroupPerson_personId_idx" ON "GroupPerson"("personId");

-- CreateIndex
CREATE INDEX "GroupPerson_groupId_idx" ON "GroupPerson"("groupId");

-- AddForeignKey
ALTER TABLE "GroupPerson" ADD CONSTRAINT "GroupPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPerson" ADD CONSTRAINT "GroupPerson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
