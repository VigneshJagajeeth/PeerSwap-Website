import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ListingCard from './components/ListingCard';
import Footer from './components/Footer';
import ProfilePage from './pages/ProfilePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import Recommendations from './components/Recommendations';
import { MOCK_LISTINGS_DATA, MOCK_USERS } from './constants';
import { Listing, ListingType, ListingUser, UserProfile } from './types';
import FeaturesSection from './components/FeaturesSection';

export type FilterType = ListingType | 'ALL';
export type ViewType = 'marketplace' | 'profile' | 'listingDetail';

const DEFAULT_AVATAR_URL = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" /></svg>';

const App: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [view, setView] = useState<ViewType>('marketplace');
  
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>(MOCK_LISTINGS_DATA);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setSignUpModalOpen] = useState(false);

  const currentUser = useMemo(() => allUsers.find(u => u.id === currentUserId) || null, [currentUserId, allUsers]);
  const selectedUser = useMemo(() => allUsers.find(u => u.id === selectedProfileId) || null, [selectedProfileId, allUsers]);

  const handleLogin = (userId: number) => {
    setCurrentUserId(userId);
    setLoginModalOpen(false);
  };
  
  const handleSignUp = (name: string, bio: string) => {
    const newUser: UserProfile = {
      id: Date.now(),
      name,
      bio,
      avatarUrl: DEFAULT_AVATAR_URL,
      joinedDate: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      averageRating: 0,
      totalReviews: 0,
      isAccountVerified: false,
      reviews: [],
      listings: [],
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setSignUpModalOpen(false);
  };

  const handleLogout = () => {
    // If viewing own profile when logging out, go back to marketplace
    if (selectedProfileId === currentUserId) {
      setView('marketplace');
      setSelectedProfileId(null);
    }
    setCurrentUserId(null);
  };

  const handleMyAccount = () => {
    if (currentUser) {
      setSelectedProfileId(currentUser.id);
      setSelectedListing(null);
      setView('profile');
      window.scrollTo(0, 0);
    }
  };

  const handleAddNewListing = async (newListingData) => {
  if (!currentUser) return;

  try {
    console.log("Adding to Firebase:", newListingData);

    await addDoc(collection(db, "listings"), {
      ...newListingData,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      createdAt: new Date()
    });

    console.log("✅ Listing added to Firebase");

  } catch (error) {
    console.error("❌ Error adding listing:", error);
  }
};
    const newListing: Listing = {
      ...newListingData,
      id: Date.now(),
      user: listingUser,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/600/400`,
    };

    // Update global listings
    setAllListings(prev => [newListing, ...prev]);

    // Update user's listings in the allUsers state
    setAllUsers(prevUsers => prevUsers.map(user => {
      if (user.id === currentUser.id) {
        return { ...user, listings: [newListing, ...user.listings] };
      }
      return user;
    }));
  };

  const handleUserSelect = (user: ListingUser) => {
    setSelectedProfileId(user.id);
    setSelectedListing(null);
    setView('profile');
    window.scrollTo(0, 0);
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    setView('listingDetail');
    window.scrollTo(0, 0);
  }
  
  const handleBackToMarketplace = () => {
    setView('marketplace');
    setSelectedProfileId(null);
    setSelectedListing(null);
  };
  
  const handleGoHome = () => {
    setActiveFilter('ALL');
    setSearchQuery('');
    setSubmittedQuery('');
    handleBackToMarketplace();
    window.scrollTo(0, 0);
  };

  const handleFilterSelect = (filter: FilterType) => {
    setActiveFilter(filter);
    handleBackToMarketplace();
  };
  
  const handleSearchSubmit = () => {
    setSubmittedQuery(searchQuery);
    handleBackToMarketplace();
  };
  
  const handlePurchaseListing = (listingId: number) => {
    if (!currentUser) {
      setLoginModalOpen(true);
      return;
    }

    const listingToBuy = allListings.find(l => l.id === listingId);
    if (!listingToBuy) return;

    if (listingToBuy.user.id === currentUser.id) {
      alert("You can't purchase your own item!");
      return;
    }

    // Remove listing from global state
    setAllListings(prev => prev.filter(l => l.id !== listingId));

    // Remove listing from the seller's profile
    setAllUsers(prevUsers => prevUsers.map(user => {
      if (user.id === listingToBuy.user.id) {
        return { ...user, listings: user.listings.filter(l => l.id !== listingId) };
      }
      return user;
    }));

    alert(`Congratulations! You have successfully acquired "${listingToBuy.title}".`);
    handleBackToMarketplace();
  };

  const recommendedListings = useMemo(() => {
    return allListings.slice(0, 5);
  }, [allListings]);

  const filteredListings = useMemo(() => {
    const byCategory = activeFilter === 'ALL'
      ? allListings
      : allListings.filter(listing => listing.listingType === activeFilter);

    if (!submittedQuery.trim()) {
      return byCategory;
    }

    const lowercasedQuery = submittedQuery.toLowerCase();
    return byCategory.filter(listing => 
      listing.title.toLowerCase().includes(lowercasedQuery)
    );
  }, [activeFilter, submittedQuery, allListings]);
  
  const ListingsGrid = ({ listings }: { listings: Listing[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {listings.length > 0 ? (
        listings.map(listing => (
          <ListingCard 
            key={listing.id} 
            listing={listing} 
            onUserSelect={handleUserSelect}
            onListingSelect={handleListingSelect}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-gray-500">
          <h3 className="text-xl font-semibold">No listings found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch(view) {
      case 'profile':
        return selectedUser && (
          <ProfilePage 
            user={selectedUser} 
            onBack={handleBackToMarketplace}
            isCurrentUser={selectedUser.id === currentUser?.id}
            onAddNewListing={handleAddNewListing}
            onListingSelect={handleListingSelect}
          />
        );
      case 'listingDetail':
        return selectedListing && (
            <ListingDetailPage
                listing={selectedListing}
                currentUser={currentUser}
                onBack={handleBackToMarketplace}
                onUserSelect={handleUserSelect}
                onPurchase={handlePurchaseListing}
            />
        );
      case 'marketplace':
      default:
        if (currentUser) {
           // Logged-in view: Recommendations + marketplace listings
           return (
             <>
               <Recommendations listings={recommendedListings} onListingSelect={handleListingSelect} />
               <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                 <h2 className="text-3xl font-bold text-gray-800 mb-8">All Listings</h2>
                 <ListingsGrid listings={filteredListings} />
               </div>
             </>
           );
        } else {
            // Logged-out view: Hero section and marketplace exploration
            const FilterButton = ({ filter, label }: { filter: FilterType; label: string }) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              );
            };

            return (
              <>
                <Hero onGetStarted={() => setSignUpModalOpen(true)} />
                <FeaturesSection />
                <div className="bg-white">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                      Explore the Marketplace
                    </h2>
                    <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8">
                      Find what you need or offer your skills. Filter by category to get started.
                    </p>
                    
                    <div className="flex justify-center items-center space-x-2 sm:space-x-4 mb-10 p-2 bg-gray-100 rounded-full max-w-md mx-auto">
                      <FilterButton filter="ALL" label="All" />
                      <FilterButton filter={ListingType.SALE} label="Buy" />
                      <FilterButton filter={ListingType.RENTAL} label="Rent" />
                      <FilterButton filter={ListingType.SKILL} label="Skills" />
                    </div>

                    <ListingsGrid listings={filteredListings} />
                  </div>
                </div>
              </>
            );
        }
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        currentUser={currentUser}
        onLogin={() => setLoginModalOpen(true)}
        onSignUp={() => setSignUpModalOpen(true)}
        onLogout={handleLogout}
        onMyAccount={handleMyAccount}
        onFilterSelect={handleFilterSelect}
        onGoHome={handleGoHome}
      />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
      {isLoginModalOpen && (
        <LoginModal 
          users={allUsers}
          onLogin={handleLogin}
          onClose={() => setLoginModalOpen(false)}
        />
      )}
      {isSignUpModalOpen && (
        <SignUpModal 
          onSignUp={handleSignUp}
          onClose={() => setSignUpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
